<div align="center">
  <h1>🚀 AI-Powered Intern Management System</h1>
  <p>
    <em>An enterprise-grade, multi-tier collaboration platform automating intern onboarding, task coordination, performance prediction, and real-time cohort communications.</em>
  </p>

  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Managed-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Queue-DC382D?style=flat-square&logo=redis)](https://redis.io/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Microservice-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
</div>

---

## 📖 Overview

The **AI-Powered Intern Management System** is a production-grade enterprise monorepo platform designed to optimize internship pipelines, streamline task lifecycles, and provide real-time collaborative communication. 

Equipped with a vector-backed **RAG (Retrieval-Augmented Generation)** assistant, deep resume-opportunity vector matching, and XGBoost predictive analytics, it decreases administrative overhead for HR teams, accelerates mentorship scaling, and boosts final hiring conversion rates.

---

## ✨ Key Features

* **Instant Geofenced Attendance**: GPS-bound clock-in/out validating location boundaries via the Haversine algorithm.
* **Structured Onboarding Verification**: Visual progression tracks ensuring compliance checklists are fully audited.
* **Dynamic Task & Submission Lifecycle**: Comprehensive task assignment boards, drag-and-drop file submissions, grading systems, and real-time feedback loops.
* **Unified Comms Hub**: Real-time channels polling messaging threads with voice memos (`audio/webm`), camera-captured HD attachments, dynamic polling, and event calendar RSVPs.
* **WhatsApp-Style Deletion System**: Full *Delete for Everyone* database revoking combined with persistent client-side *Delete for Me* filters to eliminate state desynchronization.
* **Zero-Trust Session Guard**: Cryptographically secure 6-digit OTP codes, 3-attempt lockouts, and hardware-fingerprinted trusted device sessions (valid for 3 hours) to bypass challenges safely.
* **Compliance Audit Logger**: Fully logs operational administrators, actions, resources, browsers, and IP locations.

---

## 🏗️ Architecture

The monorepo operates on a decoupled multi-tier microservices architecture:

```text
📦 AI-Powered-Intern-Management-System
 ┣ 📂 .github/         👉 Automated GitHub Actions PR Check & Deploy workflows
 ┣ 📂 frontend/        👉 Presentation Client (React 19 + TypeScript + Vite + TailwindCSS v4)
 ┣ 📂 backend/         👉 Gateway Router API (Node.js + Express + TypeScript + Prisma ORM)
 ┗ 📂 ai_service/      👉 Python AI Microservice (FastAPI + Uvicorn + FAISS + XGBoost)
```

### System Component Mappings
1. **Presentation Layer (React 19 SPA)**: Powered by Zustand for lightweight state management and React Query (TanStack Query v5) for server-state synchronization.
2. **Gateway Controller Layer (Express.js)**: Orchestrates REST API controllers, Zod validation models, and Helmet/CORS security setups.
3. **Background Job Workers (Redis + BullMQ)**: Offloads heavy async processing (emails, reports) into memory-backed message queues.
4. **AI Processing Service (FastAPI)**: Runs intensive natural language processing (FAISS vector matching, resume parsing) and predictive modeling in Python.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, TailwindCSS (v4), Zustand, React Query, Recharts, Framer Motion, HTML5 Audio & Webcam API
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, Winston Logger, BullMQ, Redis, Zod, Helmet, Bcrypt
* **AI Service**: Python 3.11, FastAPI, FAISS, SentenceTransformers, LangChain, Scikit-Learn, XGBoost, PyMuPDF, NLTK
* **Database**: PostgreSQL (Hosted on Neon/Render)
* **DevOps & Infrastructure**: Docker, Docker Compose, GitHub Actions, Vercel, Render Cloud

---

## 👥 User Roles & Access Control

The platform enforces a granular **Role-Based Access Control (RBAC)** design:

| Role | Access Level | Implemented Views & Dashboards |
|---|---|---|
| **Super Admin** | Full System Control | Platform Settings, BullMQ Queues, System Compliance Logs |
| **HR** | Platform Coordinator | Onboarding approval, Candidate opportunity-matching, Dashboard reports |
| **Department Head** | Department Oversight | Departmental KPI analytics, Intern performance trackers |
| **Mentor** | Direct Supervisor | Task distribution, PDF submission grading, Sentiment review logs |
| **Intern** | Individual Contributor | GPS attendance check, Portfolio, Task board, AI Chatbot |

---

## 🤖 AI Service & Model Features

* **FAISS Contextual Tutor Bot**: Uses Retrieval-Augmented Generation (RAG) over operational guidelines to answer questions accurately.
* **Vector Cosine Matching**: Converts candidate resumes and internship criteria into vector embeddings to compute skill matching percentages.
* **XGBoost Performance Predictor**: Predicts cohort graduation rates and hiring outcomes based on historical metrics.
* **VADER Sentiment Tracker**: Conducts sentiment analysis on feedback logs to identify at-risk cohorts early.
* **PyMuPDF Feature Parser**: Automated text extraction from uploaded PDF resumes.

---

## 📸 Screenshots & Visuals
*(To populate production-grade screenshots, refer to the [Screenshot Plan & Checklist](docs/screenshot-plan.md).)*

```text
[Landing Page Dark Theme Mockup]
[HR Dashboard Performance Charts]
[Intern Chatbot Copilot Interface]
```

---

## 🚀 Quick Start & Installation

### 🛠️ Prerequisites
* **Node.js**: `v20.x` or later
* **npm**: `v10.x` or later
* **Python**: `v3.11.x` or later
* **Docker & Compose**: Running locally
* **PostgreSQL & Redis**: Set up or running via Docker

---

## 🐳 Docker Setup
The workspace is fully containerized. To spin up the entire multi-tier production simulation locally in one command:

```bash
# Clone the repository
git clone https://github.com/vrajgoti07/AI-powered-intern-management-system.git
cd AI-powered-intern-management-system

# Spin up all 5 containers (Postgres, Redis, Backend, Frontend, AI Service)
docker-compose up -d --build
```
The services will be active on:
* **Frontend SPA**: `http://localhost:3000`
* **Backend Gateway API**: `http://localhost:5000`
* **AI Microservice**: `http://localhost:8000`

---

## 💻 Local Development Setup

To configure individual services outside of Docker for granular development:

### 1. Database Setup
```bash
cd backend
npm install --legacy-peer-deps
# Build the TypeScript compiler & Prisma client
npm run build
# Deploy local migrations and seed standard mock records
npx prisma db push
npx prisma db seed
```

### 2. Launching Services
Run the following commands in **separate terminal windows**:

#### Frontend Client (`http://localhost:5173`)
```bash
cd frontend
npm install
npm run dev
```

#### Backend REST API Gateway (`http://localhost:5000`)
```bash
cd backend
# Starts nodemon hot-reload compiler
npm run dev
```

#### Python AI Service (`http://localhost:8000`)
```bash
cd ai_service
# Setup virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows PowerShell
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

---

## 🧪 Running Tests

The system features extensive automated test coverage across all service tiers.

### Backend Tests (Jest & Supertest)
Run unit and API integration tests:
```bash
cd backend
npm run test
```

### Frontend Tests (Vitest & React Testing Library)
Run unit and UI component assertions:
```bash
cd frontend
npm run test
```

### AI Service Tests (Pytest)
Run NLP and predictive model pipeline tests:
```bash
cd ai_service
pytest
```
```

---

## 📡 API Documentation
API documentation is fully integrated and generated dynamically via **Swagger & OpenAPI**:

* **Interactive Swagger UI Dashboard**: `http://localhost:5000/api/v1/docs` (Verify endpoints, trigger authorizations, and execute live tests)
* **Raw spec JSON Endpoint**: `http://localhost:5000/api/v1/docs.json`

---

## ⚙️ CI/CD Pipeline

The project implements automated **GitHub Actions CI/CD workflows** to guarantee stability:

* **`.github/workflows/pr-check.yml`**: Triggers upon pull requests to `main` and `develop`. Executes parallel jobs:
  * **test-frontend**: Runs ESLint and Vitest suites with coverage checks.
  * **test-backend**: Spins up Postgres & Redis containers, runs TypeScript compiler checks, and executes Jest suites.
  * **test-ai-service**: Installs dependencies and runs pytest with coverage metrics.
* **`.github/workflows/deploy-prod.yml`**: Triggers automatically upon merges/pushes to the `main` branch, triggering secure Render deployment hooks.

---

## 🚀 Cloud Deployment

* **Frontend Layer**: Hosted on **Vercel** with automatic GitHub integration.
* **Backend gateway Web Service**: Deployed on **Render** (monitored via custom healthy probes).
* **AI Microservice**: Deployed as a standalone Python container on **Render**.

---

## 📁 Project Structure

```text
📦 AI-Powered-Intern-Management-System
 ┣ 📂 .github/workflows         👉 CI/CD Pipeline Definitions
 ┣ 📂 docs/                     👉 System Architecture & Portfolio Documentation
 ┣ 📂 frontend/
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 components/           👉 Reusable Design System Components
 ┃ ┃ ┣ 📂 pages/                👉 Dashboard views mapped by RBAC Role
 ┃ ┃ ┣ 📂 store/                👉 Zustand lightweight state managers
 ┃ ┃ ┗ 📂 services/             👉 React Query API integrations
 ┣ 📂 backend/
 ┃ ┣ 📂 prisma/                 👉 SQL database schema & seed scripts
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📂 config/               👉 Port binding, database & Redis adapters
 ┃ ┃ ┣ 📂 controllers/          👉 Request handlers & Winston log integrations
 ┃ ┃ ┣ 📂 routes/               👉 Route endpoints mapped with JSDoc Swagger annotations
 ┃ ┃ ┣ 📂 middleware/           👉 JWT, rate-limit, and parameter validations
 ┃ ┃ ┗ 📂 services/             👉 Business logic & Audit log triggers
 ┗ 📂 ai_service/
   ┣ 📂 app/
   ┃ ┣ 📂 routes/               👉 FastAPI paths (RAG, sentiment, risk analysis)
   ┃ ┣ 📂 services/             👉 Vector similarity computations & ML classifiers
   ┃ ┗ 📂 training/             👉 XGBoost and predictive classifier trainers
```

---

## 🛡️ Security Features

* **Zero-Trust Access**: Layered session authentication with cryptographically secure OTP validation.
* **Hardware Fingerprinting**: Captures device tokens to allow secure session bypasses for 3 hours.
* **Input Sanitization**: Strict runtime data layout constraints utilizing Express Zod middleware.
* **API Protection**: Helmet security headers and strict Express Rate Limiting against DDoS.
* **Parameterized Database Queries**: Fully parameterized SQL CRUD execution via Prisma, eliminating SQL injection paths.

---

## 🔮 Future Enhancements
* **OCR Fallback Layer**: Integrate optical character recognition to parse scanned image resumes.
* **WebSocket Live Chat Scaling**: Migrate polling communication into a full-duplex socket network.
* **Mobile App Wrapping**: Package the React 19 Client SPA inside React Native or Capacitor for native iOS/Android support.

---

## 🔍 Troubleshooting

Here are solutions to common SRE and engineering issues encountered during setup:

### 1. Port 5000 is Already in Use
- **Cause**: Another service or a dangling background node process is holding the port.
- **Solution**: Free the port using PowerShell or Terminal:
  ```powershell
  # Windows PowerShell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  ```
  ```bash
  # Linux/macOS
  kill -9 $(lsof -t -i:5000)
  ```

### 2. BullMQ / Redis Connection Refused
- **Cause**: Redis server is not running or the backend configuration is pointing to an incorrect URL.
- **Solution**: Verify that Redis is running locally:
  ```bash
  docker compose ps
  ```
  If Redis is not running, spin it up using `docker compose up -d redis`. Check `REDIS_URL` in `backend/.env`.

### 3. Prisma Migrations Fail on Boot
- **Cause**: Database is not accessible or has schema discrepancies.
- **Solution**: Ensure your PostgreSQL service is online. Reset database states and deploy clean migrations:
  ```bash
  cd backend
  npx prisma db push --force-reset
  npx prisma migrate dev
  ```

### 4. Sentry Telemetry is Disabled
- **Cause**: `SENTRY_DSN` is not defined in `backend/.env`.
- **Solution**: Sentry is defensively loaded and will be disabled in local development by design unless a valid DSN string is supplied. Create a DSN on [sentry.io](https://sentry.io/) and add it to your environment backend configuration.

---

## 👨‍💻 Contributors
Built with high architectural standards and modern software practices.

* **GitHub**: [@vrajgoti07](https://github.com/vrajgoti07)
* **Project Repository**: [vrajgoti07/AI-powered-intern-management-system](https://github.com/vrajgoti07/AI-powered-intern-management-system)
