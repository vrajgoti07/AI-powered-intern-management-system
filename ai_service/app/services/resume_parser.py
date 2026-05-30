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

# Lazy-loaded spacy model
_nlp = None

def _get_nlp():
    """Lazy-load the spacy model only when first needed."""
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            import sys
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    import fitz  # PyMuPDF
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
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
    nlp = _get_nlp()
    doc = nlp(text)
    
    name = ""
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text
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

def parse_resume(pdf_bytes: bytes, required_skills: List[str] = None) -> Dict[str, Any]:
    text = extract_text_from_pdf(pdf_bytes)
    
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
