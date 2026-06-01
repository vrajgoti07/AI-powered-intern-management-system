# SRE Production Readiness Checklist

This document details the checklist required to promote the **AI-Powered Intern Management System** from staging to an enterprise-grade production environment.

---

## 🛡️ 1. Security & Compliance

- [ ] **Enforce TLS/HTTPS**: All client and server interactions must happen exclusively over HTTPS.
- [ ] **Secure HTTP Headers**: Maintain Helmet in the Express gateway to prevent common clickjacking, XSS, and MIME-sniffing exploits.
- [ ] **Rate Limiting Guard**: Verify that `express-rate-limit` is actively backed by memory/Redis to prevent DDoS attacks across API endpoints.
- [ ] **Secrets Management**: Absolutely zero hardcoded credentials in codebase repository files. Secure secrets using Vercel/Render env managers.
- [ ] **JWT Key Rotation**: Schedule quarterly rotation of `JWT_SECRET` and `JWT_REFRESH_SECRET`. Ensure secret keys are cryptographically generated and are at least 32 characters in length.
- [ ] **Prisma Sanitization**: Verify that all database queries are fully parameterized via the Prisma ORM.

> [!WARNING]
> Ensure CORS configs (`CORS_ORIGIN`) restrict incoming API requests to the explicit frontend URL rather than utilizing `*` in production.

---

## 💾 2. Backups & Disaster Recovery (DR)

- [ ] **Automated SQL Backups**: Configure daily automated snapshots of the PostgreSQL database (Neon or Amazon RDS) with a 30-day retention window.
- [ ] **Point-in-Time Recovery (PITR)**: Enable continuous archiving to permit state restoration up to any specific second during a disaster event.
- [ ] **Database Replication**: Setup a read replica in a distinct geographic region to achieve high-availability (HA).
- [ ] **Redis Persistence**: Configure Redis RDB (snapshotting) or AOF (Append-Only File) to retain transient queues and sessions in case of service crashes.

---

## 📈 3. Monitoring & Telemetry

- [ ] **Error Tracking**: Initialize Sentry (`@sentry/node`) at server startup and confirm operational exceptions are captured inside `error.middleware.ts`.
- [ ] **Sentry DSN Key Configuration**: Verify `SENTRY_DSN` is populated on the Render environment to activate capturing.
- [ ] **Service Uptime Checks**: Configure ping monitors (e.g., Uptime Robot, Better Uptime) targeting the `/health` routes of both the backend Express and the AI services.
- [ ] **FastAPI Metrics**: Leverage Prometheus instrumentation or Cloudwatch logs to monitor FastAPI request latency and memory utilization.

---

## 📝 4. Structured Logging

- [ ] **Structured JSON Logs**: Ensure the Express Winston logger outputs formatted JSON logs in production for easier querying in log managers (e.g., Datadog, Loggly).
- [ ] **Log Levels**: Restrict active logging levels to `info`, `warn`, and `error` in production to prevent resource exhaustion and log noise.
- [ ] **Log Retention**: Configure a 14-day retention limit on cloud logging platforms (Render, Vercel) or forward logs to an external bucket (S3) for compliance storage.

---

## 🧪 5. Testing & Verification

- [ ] **Automated Test Coverage**: Maintain a baseline of at least 80% coverage on backend endpoint controllers and key frontend components.
- [ ] **Mocking External Integrations**: Guard integration suites against active external calls (such as Resend SMTP or OpenAI API) utilizing robust mock adapters.
- [ ] **Continuous Integration (CI)**: Block pull requests from merging if any GitHub Actions workflow step fails.

---

## 🚀 6. Infrastructure & Deployment

- [ ] **Zero-Downtime Rolling Deploys**: Configure Render and Vercel services to spin up new healthy containers before shutting down old active containers.
- [ ] **Healthy Probes**: Hook Render backend deployment to `/api/v1/health` with a 30-second checking interval.
- [ ] **Docker Engine Optimization**: Set CPU and memory bounds within `docker-compose.yml` or the Docker runtime limits to avoid resource-leakage crashes.

---

## 🗄️ 7. Database Tuning (PostgreSQL & Redis)

- [ ] **Connection Pooling**: Utilize a connection pooler (e.g., Prisma Accelerate or PgBouncer) to prevent database connection exhaustion under load.
- [ ] **Index Analysis**: Audit database queries frequently. Ensure appropriate indexing on core Prisma queries (such as `User.email`, `Intern.cohort`).
- [ ] **Redis Memory Bounds**: Enforce an `allkeys-lru` or `volatile-lru` eviction policy inside Redis to handle queue storage exhaustion gracefully.

---

## 🤖 8. AI Service Production Standards

- [ ] **API Key Protection**: Never check in OpenAI API tokens. Guard model calls under isolated environment parameters.
- [ ] **XGBoost Cold-Start Guards**: Verify fallback pathways exist for predicting performance grades if historical training samples are absent.
- [ ] **SentenceTransformer Caching**: Ensure pre-computed vector embeddings are cached locally to minimize redundant external API computations.
