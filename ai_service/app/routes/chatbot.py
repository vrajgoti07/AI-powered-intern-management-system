from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
import json
import hashlib

from app.services.rag_chatbot import chatbot_service

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    userId: str

@router.post("/chatbot/add-document")
async def add_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        content = await file.read()
        chunks_added = chatbot_service.add_document(content, file.filename)
        return {"message": f"Successfully indexed {chunks_added} chunks from {file.filename}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/query")
async def query_chatbot(query_req: QueryRequest, request: Request):
    redis_client = getattr(request.app.state, "redis", None)
    cache_key = None
    if redis_client:
        try:
            # Create unique hash key based on userId and question
            key_str = f"chatbot:{query_req.userId}:{query_req.question}"
            cache_key = f"chatbot_cache:{hashlib.sha256(key_str.encode('utf-8')).hexdigest()}"
            cached_res = redis_client.get(cache_key)
            if cached_res:
                return json.loads(cached_res)
        except Exception:
            pass

    try:
        response = chatbot_service.query(query_req.question, query_req.userId)
        
        if redis_client and cache_key:
            try:
                # Cache for 15 minutes (900 seconds)
                redis_client.set(cache_key, json.dumps(response), ex=900)
            except Exception:
                pass
                
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chatbot/history/{user_id}")
async def get_history(user_id: str):
    return chatbot_service.get_history(user_id)

@router.delete("/chatbot/history/{user_id}")
async def clear_history(user_id: str):
    success = chatbot_service.clear_history(user_id)
    if success:
        return {"message": f"History cleared for user {user_id}"}
    else:
        return {"message": "No history found for this user."}
