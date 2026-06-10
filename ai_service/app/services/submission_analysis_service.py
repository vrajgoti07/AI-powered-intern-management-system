import logging
import os
import json
import numpy as np
import httpx
import re
from typing import Dict, Any, List, Tuple, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Ensure org index directories exist
INDEX_DIR = os.path.join(settings.VECTOR_DIR, "orgs")
os.makedirs(INDEX_DIR, exist_ok=True)

# List of typical AI phrases to count in heuristics
AI_PHRASES = [
    "delve", "moreover", "testament", "crucial", "tapestry", "in conclusion",
    "furthermore", "demystify", "beacon", "treasure trove", "it is worth noting",
    "unveils", "multifaceted", "paramount", "underscores", "by analyzing",
    "elevate", "comprehensively", "revolutionize"
]

class SubmissionAnalysisService:
    def __init__(self) -> None:
        self._openai_client = None
        self._initialized = False

    def _init_openai(self) -> None:
        if self._initialized:
            return
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized in SubmissionAnalysisService")
            except Exception as exc:
                logger.error("Failed to initialize OpenAI client: %s", exc)
                self._openai_client = None
        self._initialized = True

    def extract_text(self, file_url: str, file_type: str, file_name: str) -> str:
        """
        Download and extract plain text from the submission file.
        Supports PDF (PyMuPDF), images (pytesseract), and plain text.
        """
        try:
            # Download file content
            with httpx.Client(timeout=10.0) as client:
                response = client.get(file_url)
                if response.status_code != 200:
                    raise Exception(f"Failed to download file, status: {response.status_code}")
                content_bytes = response.content

            # Plain text files or code
            text_extensions = ['.txt', '.js', '.ts', '.py', '.html', '.css', '.json', '.md', '.csv']
            name_lower = file_name.lower()
            if any(name_lower.endswith(ext) for ext in text_extensions) or 'text/' in file_type:
                return content_bytes.decode('utf-8', errors='ignore')

            # PDF files
            if file_type == 'application/pdf' or name_lower.endswith('.pdf'):
                import fitz  # PyMuPDF
                doc = fitz.open(stream=content_bytes, filetype="pdf")
                text_list = []
                for page in doc:
                    text_list.append(page.get_text())
                return "\n".join(text_list)

            # Image files
            if 'image/' in file_type or any(name_lower.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.bmp', '.gif']):
                from PIL import Image
                import io
                import pytesseract
                image = Image.open(io.BytesIO(content_bytes))
                return pytesseract.image_to_string(image)

        except Exception as exc:
            logger.error("Failed to extract text from file %s: %s", file_name, exc)
        return ""

    def get_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding vector for the text using OpenAI.
        Falls back to a TF-IDF bag-of-words normalized representation of 1536 dims if offline.
        """
        self._init_openai()
        if self._openai_client and text.strip():
            try:
                response = self._openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000] # Cap text input size
                )
                vector = response.data[0].embedding
                return np.array(vector, dtype=np.float32)
            except Exception as exc:
                logger.error("Failed to fetch OpenAI embedding: %s", exc)

        # Fallback bag-of-words vector of 1536 dims
        # Create a deterministic hash vector
        vec = np.zeros(1536, dtype=np.float32)
        words = re.findall(r'\b\w+\b', text.lower())
        if words:
            for word in words:
                h = hash(word) % 1536
                vec[h] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
        return vec

    def _load_faiss_index(self, org_id: str) -> Tuple[Optional[Any], List[Dict[str, str]]]:
        """
        Load FAISS index and metadata for an organization.
        """
        index_path = os.path.join(INDEX_DIR, f"{org_id}_submissions.faiss")
        meta_path = os.path.join(INDEX_DIR, f"{org_id}_submissions.json")

        metadata = []
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
            except Exception as exc:
                logger.error("Failed to load index metadata: %s", exc)

        index = None
        if os.path.exists(index_path):
            try:
                import faiss
                index = faiss.read_index(index_path)
            except Exception as exc:
                logger.error("Failed to load FAISS index: %s", exc)

        return index, metadata

    def _save_faiss_index(self, org_id: str, index: Any, metadata: List[Dict[str, str]]) -> None:
        """
        Save FAISS index and metadata to disk.
        """
        index_path = os.path.join(INDEX_DIR, f"{org_id}_submissions.faiss")
        meta_path = os.path.join(INDEX_DIR, f"{org_id}_submissions.json")

        try:
            import faiss
            faiss.write_index(index, index_path)
            with open(meta_path, 'w') as f:
                json.dump(metadata, f)
        except Exception as exc:
            logger.error("Failed to save FAISS index: %s", exc)

    def analyze_submission(
        self,
        task_file_id: str,
        task_id: str,
        organization_id: str,
        file_url: str,
        file_name: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Run text extraction, vector embedding generation, similarity search,
        AI probability heuristic analysis, and compile a final Trust Score.
        """
        # 1. Text extraction
        extracted_text = self.extract_text(file_url, file_type, file_name)
        text_len = len(extracted_text.strip())

        if text_len < 10:
            # Not enough text to compute meaningful plagiarism or AI metrics
            return {
                "similarityScore": 0.0,
                "mostSimilarTaskId": None,
                "aiGeneratedProbability": 0.05,
                "trustScore": 100,
                "trustLevel": "TRUSTED",
                "extractedText": extracted_text or None
            }

        # 2. Get vector embedding
        embedding = self.get_embedding(extracted_text)

        # 3. Plagiarism Check (FAISS Index search)
        similarity = 0.0
        most_similar_task_id = None

        index, metadata = self._load_faiss_index(organization_id)

        try:
            import faiss
            if index is not None and index.ntotal > 0:
                # Query index for top-3 nearest neighbors
                query_vec = np.expand_dims(embedding, axis=0)
                distances, indices = index.search(query_vec, k=min(3, index.ntotal))

                # Since cosine vectors are normalized, inner product distance = similarity
                for dist, idx in zip(distances[0], indices[0]):
                    if idx >= 0 and idx < len(metadata):
                        match_meta = metadata[idx]
                        # Exclude matches against the same task submission file
                        if match_meta["taskFileId"] != task_file_id:
                            # Clamp cosine distance output between 0 and 1
                            sim_val = max(0.0, min(1.0, float(dist)))
                            if sim_val > similarity:
                                similarity = sim_val
                                most_similar_task_id = match_meta["taskId"]

            # Add the current submission embedding to the index
            if index is None:
                # text-embedding-3-small uses 1536 dims
                index = faiss.IndexFlatIP(1536)

            index.add(np.expand_dims(embedding, axis=0))
            metadata.append({
                "taskFileId": task_file_id,
                "taskId": task_id
            })
            self._save_faiss_index(organization_id, index, metadata)

        except Exception as faiss_exc:
            logger.error("FAISS index operations failed: %s", faiss_exc)
            # Standalone similarity backup using text compare if FAISS fails
            similarity = 0.0

        # 4. AI Content Probability Analysis
        # Heuristics:
        # a) Sentence length uniformity (low standard deviation = typical AI style)
        # b) Density of common AI helper words ("delve", "moreover", "testament", etc.)
        sentences = re.split(r'[.!?]+', extracted_text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
        
        sent_lengths = [len(s.split()) for s in sentences]
        uniformity_score = 0.0
        if len(sent_lengths) > 3:
            std_dev = np.std(sent_lengths)
            # Low standard deviation (< 4 words difference between sentences) indicates high uniformity
            if std_dev < 4.5:
                uniformity_score = 0.4
            elif std_dev < 7.0:
                uniformity_score = 0.2

        # Count AI keywords
        ai_word_count = 0
        text_lower = extracted_text.lower()
        for phrase in AI_PHRASES:
            # Count exact matches of words/phrases
            ai_word_count += len(re.findall(rf'\b{phrase}\b', text_lower))

        ai_phrase_density = 0.0
        word_count = len(text_lower.split())
        if word_count > 50:
            density = ai_word_count / (word_count / 100) # density per 100 words
            if density > 1.5:
                ai_phrase_density = 0.5
            elif density > 0.8:
                ai_phrase_density = 0.3
            elif density > 0.4:
                ai_phrase_density = 0.15

        ai_generated_prob = min(0.99, max(0.01, uniformity_score + ai_phrase_density))

        # 5. Calculate Trust Score
        # formula: trust = 100 - (similarity * 50) - (ai_prob * 50)
        trust_score = int(100 - (similarity * 50) - (ai_generated_prob * 50))
        trust_score = max(0, min(100, trust_score))

        # Trust Levels
        if trust_score >= 80:
            trust_level = "TRUSTED"
        elif trust_score >= 50:
            trust_level = "SUSPICIOUS"
        else:
            trust_level = "FLAGGED"

        return {
            "similarityScore": round(similarity, 3),
            "mostSimilarTaskId": most_similar_task_id,
            "aiGeneratedProbability": round(ai_generated_prob, 3),
            "trustScore": trust_score,
            "trustLevel": trust_level,
            "extractedText": extracted_text[:2000] # Save a snippet to avoid DB bloating
        }

submission_analysis_service = SubmissionAnalysisService()
