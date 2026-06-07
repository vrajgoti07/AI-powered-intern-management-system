import io
import pytest
from unittest.mock import patch
from PIL import Image, ImageDraw
from app.services.resume_parser import parse_resume

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

@patch("pytesseract.image_to_string")
def test_scanned_image_ocr(mock_image_to_string):
    # Mock return value of pytesseract for the direct image test
    mock_image_to_string.return_value = (
        "Candidate: John Doe\n"
        "Email: johndoe@example.com\n"
        "Skills: Python, JavaScript, SQL\n"
        "Experience: Software Engineer at TechCorp"
    )
    
    image_bytes = generate_scanned_image_bytes()
    
    # Run the parse_resume function directly for the image
    result = parse_resume(image_bytes, file_type="png")
    
    # Assertions
    assert result is not None, "Parsed result should not be None"
    assert result["email"] == "johndoe@example.com", "Expected email to be extracted via OCR mock"
    assert "python" in result["skills"] and "javascript" in result["skills"] and "sql" in result["skills"], "Expected matching taxonomy skills to be found"
    
    # Verify pytesseract was invoked
    mock_image_to_string.assert_called_once()

@patch("pytesseract.image_to_string")
def test_pdf_scanned_ocr_fallback(mock_image_to_string):
    # Mock return value of pytesseract for the PDF fallback test
    mock_image_to_string.return_value = (
        "Candidate: John Doe\n"
        "Email: johndoe@example.com\n"
        "Skills: Python, JavaScript, SQL\n"
        "Experience: Software Engineer at TechCorp"
    )
    
    # Generate a mock blank PDF page with no selectable text
    import fitz
    doc = fitz.open()
    doc.new_page(width=595, height=842)
    pdf_bytes = doc.write()
    doc.close()
    
    # Run parsing on the scanned/empty PDF
    result = parse_resume(pdf_bytes, file_type="pdf")
    
    # Assertions
    assert result is not None, "Parsed result should not be None"
    assert result["email"] == "johndoe@example.com", "Expected fallback OCR to extract email"
    assert "python" in result["skills"], "Expected fallback OCR to find matching skills"
    
    # Verify pytesseract was invoked for the PDF pages
    assert mock_image_to_string.called, "Expected fallback OCR to be triggered"
