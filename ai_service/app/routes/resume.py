from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import json
from typing import Optional

from app.services.resume_parser import parse_resume

router = APIRouter()
security = HTTPBearer()

# In a real app, this should validate the JWT token against your secret or auth service
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

@router.post("/parse-resume")
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    required_skills: Optional[str] = Form(None),
    token: str = Depends(verify_token)
):
    filename_lower = file.filename.lower()
    content_type = file.content_type
    
    is_pdf = filename_lower.endswith(".pdf") or content_type == "application/pdf"
    is_jpg = filename_lower.endswith((".jpg", ".jpeg")) or content_type in ["image/jpeg", "image/jpg"]
    is_png = filename_lower.endswith(".png") or content_type == "image/png"
    
    if not (is_pdf or is_jpg or is_png):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are supported."
        )
        
    file_type = "pdf"
    if is_jpg:
        file_type = "jpg"
    elif is_png:
        file_type = "png"
        
    try:
        content = await file.read()
        
        req_skills_list = []
        if required_skills:
            try:
                req_skills_list = json.loads(required_skills)
            except:
                req_skills_list = [s.strip() for s in required_skills.split(",")]
                
        parsed_data = parse_resume(content, file_type, req_skills_list)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
