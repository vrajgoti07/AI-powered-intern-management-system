<div align="center">
  <h1>🚀 AI-Powered Intern Management System</h1>
  <p>
    <em>An advanced, production-grade, multi-tier Intern Management and Collaboration platform.</em>
  </p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Service-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)

</div>

---

## 📖 Overview

The **AI-Powered Intern Management System** is designed to coordinate intern onboarding, track tasks, synchronize evolution metrics, and provide real-time interactive channels equipped with an intelligent AI tutor. It brings together modern web technologies to create a seamless, fast, and feature-rich workspace for both management and interns.

## 🏗️ System Architecture

This project is structured as a powerful monorepo containing three distinct, decoupled services:

```text
📦 AI-Powered-Intern-Management-System
 ┣ 📂 frontend/        👉 React SPA (Vite + TypeScript + HSL Tailwind Styling)
 ┣ 📂 backend/         👉 REST API Gateway (Node.js + Express + Prisma + PostgreSQL)
 ┗ 📂 ai_service/      👉 AI Copilot Service (Python + FastAPI + Uvicorn + Gemini/LLM)
```

---

## ✨ Core Feature Highlights

### 💬 Internal Messaging Network & Comms Hub
- **Real-time Live Channels**: Unified group channels (`#general`, private support/stipend rooms) with interval-polled state synchronization.
- **Futuristic Live Camera Capture**: Custom browser-permission-driven webcam capture modal with HD (`1280x720`) video streaming, live scanner guidelines, instant frame snapshots, and integrated chat upload staging.
- **Interactive Media & Comms**: Rich attachments popover (Documents, Media, Contacts sharing, dynamic Poll voting, and workspace Calendar Event RSVPs).
- **Voice Messaging System**: In-browser audio recording via MediaRecorder API, converting voice memos to `audio/webm` and uploading them seamlessly for playback.
- **🤖 AI Coach Tutor**: Embedded AI assistant checking score constraints, attendance, and tasks.

### 🗑️ WhatsApp-Style Message Deletion
- **Delete for Everyone**: Secure API endpoint validation allowing message creators (or administrators like HR) to permanently delete messages from the database and trigger real-time updates for all cohort members.
- **Delete for Me**: High-fidelity local filtering utilizing persistent `localStorage` (scoped by user ID). This prevents background polling ticks from restoring deleted messages on the client UI across page refreshes.

### 📍 Reliable Location Synchronization
- **Express Zod Parameter Validation**: Custom middleware configuration designed to ensure route parameter parsing (`req.params`) is safely preserved during data verification.
- **Visual Portfolio Synchronization**: Live dashboard tracking workspace address updates with interactive feedback cards and singular validation notifications.

---

## 🚀 Getting Started & Launch Guide

### 🛠️ Prerequisites
Ensure your development environment meets the following requirements:
- **Node.js**: `v18.x` or later
- **npm**: `v9.x` or later
- **Python**: `v3.10.x` or later
- **PostgreSQL Database**: Running and configured

### 0️⃣ Environment Variables
Before starting the backend or frontend, configure the necessary environment variables:
1. Copy `.env.example` to `.env` inside `frontend/`, `backend/`, and `ai_service/`.
2. Update the values within each `.env` file with your local database URIs and API keys.

### 1️⃣ Database Setup & Migrations
Before starting the backend, initialize the PostgreSQL database schema:
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed   # Seeds mock interns, mentors, and administrators
```

### 2️⃣ Launch Services Locally
Run the following commands in **separate terminal windows** to start the entire ecosystem:

#### Frontend Client SPA (HTTP `5173`)
```bash
cd frontend
npm install
npm run dev
```

#### Backend Dev Server (HTTP `5000`)
```bash
cd backend
npm run dev
```

#### AI Copilot Service (HTTP `8000`)
```bash
cd ai_service
# Activate your virtual environment and install dependencies
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

---

## 🛡️ Verification & Testing Status

Both client-side and server-side components build flawlessly with **zero compilation warnings**:

- **Frontend Type Verification**: 
  `cd frontend && npx tsc --noEmit` ➔ **Passed (0 errors)** ✅
- **Backend Type Verification**: 
  `cd backend && npx tsc --noEmit` ➔ **Passed (0 errors)** ✅

---
<div align="center">
  <i>Built with passion and modern web technologies.</i>
</div>
