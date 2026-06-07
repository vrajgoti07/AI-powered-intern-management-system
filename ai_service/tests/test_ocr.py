import io
import shutil
import pytest
from PIL import Image, ImageDraw
from app.services.resume_parser import parse_resume

TESSERACT_AVAILABLE = shutil.which("tesseract") is not None

def generate_scanned_image_bytes() -> bytes:
    # Create a simple white image
    img = Image.new('RGB', (450, 150), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    # Write mock intern information legibly
    d.text((20, 20), "Candidate: John Doe", fill=(0, 0, 0))
    d.text((20, 50), "Email: johndoe@example.com", fill=(0, 0, 0))
    d.text((20, 80), "Skills: Python, JavaScript, SQL", fill=(0, 0, 0))
    d.text((20, 110), "Experience: Software Engineer at TechCorp", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

@pytest.mark.skipif(not TESSERACT_AVAILABLE, reason="Tesseract-OCR binary not installed on this host system.")
def test_scanned_image_ocr():
    image_bytes = generate_scanned_image_bytes()
    
    # Run the parse_resume function directly for the image
    result = parse_resume(image_bytes, file_type="png")
    
    # Assertions
    assert result is not None, "Parsed result should not be None"
    assert result["email"] != "", "Expected email to be extracted via OCR"
    assert len(result["skills"]) > 0, "Expected skills to be extracted via OCR"
    assert "python" in result["skills"] or "javascript" in result["skills"] or "sql" in result["skills"], "Expected matching taxonomy skills to be found"
