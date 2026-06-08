FROM python:3.11-slim

WORKDIR /app

# Set memory-conscious and performance environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONOPTIMIZE=2 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false \
    MALLOC_TRIM_THRESHOLD_=65536

# Install system compiler and build dependencies for native modules (including Tesseract OCR)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies list
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK corpora during build-time to avoid runtime network calls and memory overhead
RUN python -m nltk.downloader stopwords punkt punkt_tab vader_lexicon

# Copy remaining code files
COPY . .

# Expose service port
EXPOSE 8000

# Start command: Limit workers to 1 and restrict concurrency to optimize memory on Render free tier
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "50", "--backlog", "100"]
