# AI Microservice - Intern Management System

This directory houses the independent, high-performance **AI microservice** built with **FastAPI** and Python. It manages advanced ML tasks, including skill-matching profiles, predicting intern risk margins, assessing comments sentiment, and answering FAQs via semantic retrieval.

---

## Technical Stack
* **Framework**: FastAPI (Python >= 3.9)
* **Server**: Uvicorn
* **ML Processing**: scikit-learn, NumPy
* **NLP Processing**: TextBlob

---

## Directory Layout
```
ai_service/
├── app/
│   ├── __init__.py
│   ├── main.py               # Application entrypoint & middlewares
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── ai.py             # Pydantic input/output schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── chatbot_service.py       # Cosine Similarity FAQ agent
│   │   ├── performance_service.py   # Ridge Regression performance model
│   │   ├── role_matching_service.py # Jaccard similarity role matching
│   │   └── sentiment_service.py     # TextBlob sentiment & suggestions parsing
│   └── routes/
│       ├── __init__.py
│       └── ai.py             # FastAPI routing controllers
├── .env.example
├── .env
└── requirements.txt          # Package dependencies
```

---

## Local Setup & Launch Guide

### 1. Create Python Virtual Environment
Navigate to the `ai_service` folder and execute:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
Ensure your environment is active, then run:
```bash
pip install -r requirements.txt
```

### 3. Setup Configurations
Copy the `.env.example` into a new `.env` file:
```bash
copy .env.example .env
```

### 4. Run Server Locally
Start the FastAPI server:
```bash
python -m uvicorn app.main:app --reload
```
The server will boot up and load the regression and vectorizer models:
* Server Health check: `GET http://127.0.0.1:8000/health`
* Live interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## REST Endpoints Overview

* **`POST /api/ai/match-role`**: Computes profile similarity matches based on skills, interests, and education.
* **`POST /api/ai/predict-performance`**: Dynamic regression scoring predicting performance rating grades, risk margins, and drivers.
* **`POST /api/ai/sentiment-analysis`**: Extracts feedback positive/negative shares and isolate suggestions.
* **`POST /api/ai/chatbot`**: Retrieval-augmented FAQ matcher using TF-IDF vectors.
