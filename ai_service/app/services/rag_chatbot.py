import os
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
try:
    from langchain_community.chat_models import ChatOpenAI
    from langchain.schema import HumanMessage, SystemMessage
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# We'll use fitz directly for PDF parsing rather than LangChain's document loaders for consistency
import fitz

FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "faiss_index")

class RAGChatbotService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        self.vector_store = None
        self.chat_history: Dict[str, List[Dict[str, str]]] = {}
        
        self._load_vector_store()
        
    def _load_vector_store(self):
        if os.path.exists(FAISS_INDEX_PATH) and os.path.isdir(FAISS_INDEX_PATH):
            try:
                self.vector_store = FAISS.load_local(FAISS_INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True)
            except Exception as e:
                print(f"Failed to load FAISS index: {e}")
                self.vector_store = None
                
    def add_document(self, pdf_bytes: bytes, filename: str) -> int:
        """Extracts text, splits it, and adds to FAISS index."""
        text = ""
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
                
        chunks = self.text_splitter.split_text(text)
        
        if not chunks:
            return 0
            
        # Create metadata
        metadatas = [{"source": filename, "chunk": i} for i in range(len(chunks))]
        
        if self.vector_store is None:
            self.vector_store = FAISS.from_texts(chunks, self.embeddings, metadatas=metadatas)
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

        openai_api_key = os.environ.get("OPENAI_API_KEY")
        
        if openai_api_key and OPENAI_AVAILABLE:
            # Use OpenAI
            chat = ChatOpenAI(temperature=0, openai_api_key=openai_api_key, model="gpt-3.5-turbo")
            messages = [
                SystemMessage(content="You are a helpful HR Assistant."),
                HumanMessage(content=prompt)
            ]
            response = chat.invoke(messages)
            return response.content
        else:
            # Fallback to local Ollama (requires Ollama running locally with a model like llama3)
            try:
                llm = Ollama(model="llama3")
                response = llm.invoke(prompt)
                return response
            except Exception as e:
                return f"Error connecting to LLM (Check if OPENAI_API_KEY is set or Ollama is running): {str(e)}"

    def query(self, question: str, user_id: str) -> Dict[str, Any]:
        if self.vector_store is None:
            return {
                "answer": "The knowledge base is empty. Please upload HR documents first.",
                "sources": []
            }
            
        # Retrieve top 3 chunks
        docs = self.vector_store.similarity_search(question, k=3)
        
        context = "\n\n".join([d.page_content for d in docs])
        sources = list(set([d.metadata.get("source", "Unknown") for d in docs]))
        
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
