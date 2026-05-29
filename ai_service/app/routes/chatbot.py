from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

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
async def query_chatbot(request: QueryRequest):
    try:
        response = chatbot_service.query(request.question, request.userId)
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
