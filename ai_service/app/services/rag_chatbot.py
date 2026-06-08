import os
import threading
from typing import Dict, List, Any

FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "faiss_index")

class RAGChatbotService:
    def __init__(self):
        self.embeddings = None
        self.text_splitter = None
        self.vector_store = None
        self.chat_history: Dict[str, List[Dict[str, str]]] = {}
        self._loaded = False
        self._lock = threading.Lock()
        
    def _lazy_load(self):
        if self._loaded: return
        with self._lock:
            if self._loaded: return
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            from app.config.settings import settings
            
            openai_api_key = settings.OPENAI_API_KEY
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY is not configured. RAG Chatbot cannot be initialized.")

            from langchain_openai import OpenAIEmbeddings
            self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key, model="text-embedding-3-small")
            print("[INFO] Using OpenAIEmbeddings (text-embedding-3-small) for RAG Chatbot")
                
            self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            self._load_vector_store()
            self._loaded = True
        
    def _load_vector_store(self):
        from langchain_community.vectorstores import FAISS
        if os.path.exists(FAISS_INDEX_PATH) and os.path.isdir(FAISS_INDEX_PATH):
            try:
                self.vector_store = FAISS.load_local(FAISS_INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True)
            except Exception as e:
                print(f"Failed to load FAISS index: {e}")
                self.vector_store = None
                
    def add_document(self, pdf_bytes: bytes, filename: str) -> int:
        """Extracts text, splits it, and adds to FAISS index."""
        self._lazy_load()
        import fitz
        from langchain_community.vectorstores import FAISS as FAISSStore
        
        chunks = []
        metadatas = []
        
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page_idx, page in enumerate(doc):
                page_text = page.get_text()
                if not page_text.strip():
                    continue
                # Split page text into chunks
                page_chunks = self.text_splitter.split_text(page_text)
                for chunk in page_chunks:
                    chunks.append(chunk)
                    metadatas.append({
                        "source": filename,
                        "page": page_idx + 1,  # 1-indexed page number
                        "chunk": len(chunks) - 1
                    })
        
        if not chunks:
            return 0
            
        if self.vector_store is None:
            self.vector_store = FAISSStore.from_texts(chunks, self.embeddings, metadatas=metadatas)
        else:
            self.vector_store.add_texts(chunks, metadatas=metadatas)
            
        # Save index
        os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
        self.vector_store.save_local(FAISS_INDEX_PATH)
        
        return len(chunks)
        
    def _get_llm_response(self, context: str, question: str) -> str:
        prompt = f"""You are a helpful HR Assistant for an Intern Management System.
Use the following context to answer the user's question. If the answer is not in the context, say "I don't have enough information to answer that based on the HR policies."

Context:
{context}

Question: {question}

Answer:"""

        from app.config.settings import settings
        openai_api_key = settings.OPENAI_API_KEY
        
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured. Cannot generate response.")

        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        chat = ChatOpenAI(temperature=0, openai_api_key=openai_api_key, model="gpt-3.5-turbo")
        messages = [
            SystemMessage(content="You are a helpful HR Assistant."),
            HumanMessage(content=prompt)
        ]
        response = chat.invoke(messages)
        return response.content

    def query(self, question: str, user_id: str) -> Dict[str, Any]:
        self._lazy_load()
        if self.vector_store is None:
            return {
                "answer": "The knowledge base is empty. Please upload HR documents first.",
                "sources": []
            }
            
        # Retrieve top 3 chunks
        docs = self.vector_store.similarity_search(question, k=3)
        
        context = "\n\n".join([d.page_content for d in docs])
        
        sources = []
        seen = set()
        for d in docs:
            sf = d.metadata.get("source", "Unknown")
            pn = d.metadata.get("page")
            if pn is None:
                pn = 1
            ct = d.page_content[:120]
            
            # Deduplicate by (source_file, page_number, chunk_text)
            key = (sf, pn, ct)
            if key not in seen:
                seen.add(key)
                sources.append({
                    "source_file": sf,
                    "page_number": pn,
                    "chunk_text": ct
                })
        
        answer = self._get_llm_response(context, question)
        
        # Save history
        if user_id not in self.chat_history:
            self.chat_history[user_id] = []
            
        self.chat_history[user_id].append({"role": "user", "content": question})
        self.chat_history[user_id].append({"role": "assistant", "content": answer, "sources": sources})
        
        return {
            "answer": answer,
            "sources": sources
        }
        
    def get_history(self, user_id: str) -> List[Dict[str, Any]]:
        return self.chat_history.get(user_id, [])
        
    def clear_history(self, user_id: str) -> bool:
        if user_id in self.chat_history:
            del self.chat_history[user_id]
            return True
        return False

chatbot_service = RAGChatbotService()
