# Contributing to the AI-Powered Intern Management System

Thank you for your interest in contributing to our project! This document outlines the standards, guidelines, and processes to ensure a smooth onboarding and collaboration workflow.

---

## 🚀 Setup Instructions

Follow these steps to set up your local development environment:

### Prerequisites
- **Node.js**: `v18.x` or higher
- **Docker & Docker Compose** (for running Redis and PostgreSQL locally)
- **Git**

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vrajgoti07/AI-powered-intern-management-system.git
   cd AI-powered-intern-management-system
   ```

2. **Run Infrastructure via Docker:**
   Spin up the local PostgreSQL database and Redis cache:
   ```bash
   docker compose up -d
   ```

3. **Backend Onboarding:**
   ```bash
   cd backend
   npm install --legacy-peer-deps
   cp .env.example .env # Update credentials accordingly
   npm run prisma:generate
   npm run prisma:migrate dev
   npm run dev
   ```

4. **Frontend Onboarding:**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env # Verify API port binding
   npm run dev
   ```

5. **AI Service Setup:**
   ```bash
   cd ../ai_service
   python -m venv venv
   source venv/Scripts/activate # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 🌿 Branch Naming Guidelines

To keep our commit history clear and searchable, all branches must follow these prefix formats:

* `feature/`: For adding new features or components (e.g., `feature/sentry-integration`)
* `fix/`: For bug fixes and patches (e.g., `fix/jwt-auth-expiry`)
* `chore/`: For maintaining tooling, configurations, SRE, and documentation (e.g., `chore/env-documentation`)

**Example branch command:**
```bash
git checkout -b feature/sentry-integration
```

---

## 🔄 Pull Request Process

1. **Create a Branch**: Create a branch off of `main` using the Branch Naming guidelines.
2. **Implement Changes**: Ensure all code is modular, well-commented, and implements modern SRE and engineering standards.
3. **Run Verification Suites**:
   - Backend tests: `cd backend && npm run test`
   - Frontend builds: `cd frontend && npm run build`
4. **Draft a Pull Request**: Submit a Pull Request targeting the `main` branch.
5. **PR Review**: At least one senior maintainer must review and approve the PR. All automated checks must pass green before merge.

---

## 🎨 Coding Standards

- **TypeScript**: Statically type all variables, function arguments, and return types. Avoid the use of `any` wherever possible.
- **Express Handlers**: Always wrap asynchronous Express routes with the `asyncHandler` utility to guarantee error propagation to our central Sentry/middleware error interceptor.
- **Formating**: Use ESLint and Prettier. Run formatting before committing changes.
- **No Secrets**: Never commit secrets, passphrases, or real keys. Utilize environment templates (`.env.example`) and local `.env` files.

---

## 📝 Commit Message Guidelines

We follow the standard [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short description>

[optional body]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation modifications
- **style**: Changes that do not affect code logic (formatting, spacing)
- **refactor**: Code change that neither fixes a affect code nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or correcting test suites
- **chore**: Build processes, dependency upgrades, SRE, or auxiliary tools

### Examples
- `feat(sentry): integrate sentry node monitoring on server boot`
- `fix(auth): handle jwt expiration exception gracefully`
- `docs(readme): document troubleshooting and setup guides`
