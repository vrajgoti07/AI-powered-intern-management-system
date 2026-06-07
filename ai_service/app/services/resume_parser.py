import re
from typing import Dict, Any, List

# Predefined taxonomy of 100+ technical skills
TECH_SKILLS = set([
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", "go", "rust", "swift", "kotlin",
    "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi", "spring boot", "asp.net",
    "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "elasticsearch", "neo4j", "oracle", "sql server",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins", "gitlab ci", "github actions",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
    "pandas", "numpy", "matplotlib", "seaborn", "scipy", "xgboost", "lightgbm", "spacy", "nltk", "opencv",
    "html", "css", "sass", "less", "bootstrap", "tailwind", "material-ui", "graphql", "rest api", "soap", "grpc",
    "git", "svn", "mercurial", "agile", "scrum", "kanban", "jira", "trello", "confluence",
    "linux", "unix", "windows", "macos", "bash", "powershell", "shell scripting", "vim", "emacs",
    "cybersecurity", "penetration testing", "cryptography", "network security", "owasp", "ceh", "cissp",
    "blockchain", "smart contracts", "solidity", "ethereum", "web3", "ipfs",
    "data engineering", "hadoop", "spark", "kafka", "airflow", "snowflake", "bigquery", "redshift",
    "ui/ux", "figma", "sketch", "adobe xd", "photoshop", "illustrator",
    "qa", "testing", "selenium", "cypress", "jest", "mocha", "chai", "junit", "pytest",
    "devops", "sre", "sysadmin", "networking", "tcp/ip", "dns", "http", "https"
])



def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    import fitz  # PyMuPDF
    text = ""
    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        # Fallback to decoding raw bytes if PyMuPDF open fails
        try:
            text = pdf_bytes.decode('utf-8', errors='ignore')
        except Exception:
            text = ""
    return text

def extract_email(text: str) -> str:
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(email_pattern, text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    match = re.search(phone_pattern, text)
    return match.group(0) if match else ""

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []
    for skill in TECH_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill)
    return list(set(found_skills))

def extract_entities(text: str) -> Dict[str, Any]:
    # Extract name from the first non-empty lines of text (the first line is usually the candidate's name)
    name = ""
    lines_clean = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines_clean[:3]:
        if '@' not in line and not any(char.isdigit() for char in line) and len(line) < 35:
            name = line
            break
            
    education = []
    experience = []
    projects = []
    
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line_lower = line.lower().strip()
        if 'education' in line_lower and len(line_lower) < 15:
            current_section = 'education'
            continue
        elif ('experience' in line_lower or 'employment' in line_lower) and len(line_lower) < 20:
            current_section = 'experience'
            continue
        elif 'projects' in line_lower and len(line_lower) < 15:
            current_section = 'projects'
            continue
            
        if current_section == 'education' and len(line) > 10:
            education.append({"degree": line, "institution": "", "year": ""})
        elif current_section == 'experience' and len(line) > 10:
            experience.append({"company": line, "role": "", "startDate": "", "endDate": "", "description": ""})
        elif current_section == 'projects' and len(line) > 10:
            projects.append({"name": line, "description": "", "technologies": []})
            
    return {
        "name": name,
        "education": education[:3],
        "experience": experience[:3],
        "projects": projects[:3]
    }

def parse_resume(file_bytes: bytes, file_type: str = "pdf", required_skills: List[str] = None) -> Dict[str, Any]:
    text = ""
    
    if file_type.lower() in ["jpg", "jpeg", "png"]:
        # Direct image OCR
        import io
        from PIL import Image
        import pytesseract
        try:
            img = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(img)
        except Exception:
            text = ""
    else:
        # Standard PDF text extraction
        text = extract_text_from_pdf(file_bytes)
        
        # Scanned PDF OCR Fallback
        if len(text.strip()) < 50:
            import io
            import fitz
            from PIL import Image
            import pytesseract
            ocr_text = ""
            try:
                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    for page in doc:
                        pix = page.get_pixmap()
                        img = Image.open(io.BytesIO(pix.tobytes("png")))
                        ocr_text += pytesseract.image_to_string(img) + "\n"
                if len(ocr_text.strip()) >= 50:
                    text = ocr_text
            except Exception:
                pass
                
    email = extract_email(text)
    phone = extract_phone(text)
    skills = extract_skills(text)
    entities = extract_entities(text)
    
    skill_score = 0
    if required_skills and len(required_skills) > 0:
        req_skills_lower = [s.lower() for s in required_skills]
        matches = sum(1 for req in req_skills_lower if req in skills)
        skill_score = (matches / len(required_skills)) * 100
    else:
        skill_score = min(100, len(skills) * 5)
        
    experience_years = len(entities["experience"]) * 1.5
    
    return {
        "name": entities["name"],
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": entities["education"],
        "experience": entities["experience"],
        "projects": entities["projects"],
        "skillScore": round(skill_score, 1),
        "experienceYears": round(experience_years, 1)
    }
