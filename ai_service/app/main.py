"""
AI-Powered Intern Management System - FastAPI Microservice Entry Point.

This module bootstraps the entire AI service:
  1. Loads environment configuration
  2. Connects to Redis (graceful fallback if unavailable)
  3. Registers all 6 AI route modules under /api/ai
  4. Adds CORS and request-logging middleware
  5. Exposes a /api/ai/health endpoint for readiness checks
  6. Cleanly shuts down Redis on application exit
"""

import os
import sys
import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- Ensure project root is importable --------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Load .env before anything else -----------------------------------
load_dotenv()

from app.config.settings import settings

# --- Logging configuration --------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai_service")

# --- Import route modules ---------------------------------------------
from app.routes.matching import router as matching_router
from app.routes.sentiment import router as sentiment_router
from app.routes.chatbot import router as chatbot_router
from app.routes.recommendation import router as recommendation_router
from app.routes.analytics import router as analytics_router

# New advanced AI routes
from app.routes.resume import router as resume_router
from app.routes.performance import router as performance_router
from app.routes.ranking import router as ranking_router
from app.routes.risk import router as risk_router
from app.routes.mock_interview import router as mock_interview_router
from app.routes.new_features import router as new_features_router





# --- Lifespan: startup + shutdown logic -------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""

    # --- STARTUP ------------------------------------------------------
    logger.info("=" * 60)
    logger.info("  AI Microservice v2.0 - Starting up")
    logger.info("=" * 60)

    # 1. Connect to Redis
    redis_client = None
    try:
        import redis as redis_lib
        redis_client = redis_lib.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=3,
        )
        redis_client.ping()
        logger.info("Redis connected at %s", settings.REDIS_URL)
    except Exception as exc:
        logger.warning("Redis unavailable (%s) - running without cache", exc)
        redis_client = None

    app.state.redis = redis_client

    # 2. Verify model files exist (services load them at import time)
    models_loaded = True
    model_files = [
        os.path.join(settings.MODEL_DIR, "performance_model.pkl"),
        os.path.join(settings.MODEL_DIR, "performance_label_encoder.pkl"),
        os.path.join(settings.VECTOR_DIR, "department_vectors.pkl"),
    ]
    for mf in model_files:
        if os.path.exists(mf):
            logger.info("  Model found: %s", os.path.basename(mf))
        else:
            logger.warning("  Model missing: %s - run training scripts", mf)
            models_loaded = False

    app.state.models_loaded = models_loaded

    # 3. Start APScheduler if enabled
    try:
        from app.services.risk_detector import init_scheduler
        init_scheduler()
    except Exception as exc:
        logger.warning("Failed to initialize background scheduler: %s", exc)

    logger.info("-" * 60)
    logger.info("  AI Microservice ready on http://%s:%s", settings.FASTAPI_HOST, settings.FASTAPI_PORT)
    logger.info("-" * 60)



    yield

    # --- SHUTDOWN -----------------------------------------------------
    logger.info("Shutting down AI Microservice...")

    try:
        from app.services.risk_detector import shutdown_scheduler
        shutdown_scheduler()
    except Exception:
        pass

    if app.state.redis is not None:
        try:
            app.state.redis.close()
            logger.info("Redis connection closed")
        except Exception:
            pass
    logger.info("Shutdown complete.")


# --- Create FastAPI application ---------------------------------------

app = FastAPI(
    title="AI-Powered Intern Management System Microservice",
    description=(
        "Machine Learning and NLP engine providing role matching, "
        "performance prediction, sentiment analysis, chatbot support, "
        "personalised recommendations, and analytics."
    ),
    version="2.0.0",
    lifespan=lifespan,
)


# --- CORS Middleware --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Logging Middleware ---------------------------------------

@app.middleware("http")
async def clean_double_slashes(request: Request, call_next):
    """Clean up double/multiple consecutive slashes in request path."""
    path = request.scope.get("path", "")
    if "//" in path:
        import re
        clean_path = re.sub(r"/+", "/", path)
        request.scope["path"] = clean_path
        if "raw_path" in request.scope:
            request.scope["raw_path"] = clean_path.encode("ascii")
    return await call_next(request)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with method, path, and duration."""
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(
        "%s %s → %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# --- Register Routers ------------------------------------------------

app.include_router(matching_router, prefix="/api/ai", tags=["Role Matching"])
app.include_router(sentiment_router, prefix="/api/ai", tags=["Sentiment Analysis"])
app.include_router(chatbot_router, prefix="/api/ai", tags=["AI Chatbot"])
app.include_router(recommendation_router, prefix="/api/ai", tags=["Recommendations"])
app.include_router(analytics_router, prefix="/api/ai", tags=["Analytics"])

# Advanced AI features
app.include_router(resume_router, prefix="/api/ai", tags=["Resume Parsing"])
app.include_router(performance_router, prefix="/api/ai", tags=["XGBoost Performance"])
app.include_router(ranking_router, prefix="/api/ai", tags=["Smart Ranking"])
app.include_router(risk_router, prefix="/api/ai", tags=["Risk Detection"])
app.include_router(mock_interview_router, prefix="/api/ai", tags=["AI Mock Interview"])
app.include_router(new_features_router, prefix="/api/ai", tags=["New AI Features"])



# --- Health Check ----------------------------------------------------

@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Root health check for load balancers",
    tags=["Health"],
)
async def root():
    """Return operational status of the AI microservice for root-level probes."""
    return {
        "status": "ok",
        "service": "AI-Powered Intern Management Microservice v2.0",
        "message": "AI Microservice is running. Go to /api/ai/health for full health details."
    }


@app.get(
    "/api/ai/health",
    status_code=status.HTTP_200_OK,
    summary="Health check - verify service, models, and Redis status",
    tags=["Health"],
)
async def health_check(request: Request):
    """Return operational status of the AI microservice."""
    redis_ok = False
    if request.app.state.redis is not None:
        try:
            request.app.state.redis.ping()
            redis_ok = True
        except Exception:
            pass

    return {
        "status": "ok",
        "service": "AI-Powered Intern Management Microservice v2.0",
        "models_loaded": getattr(request.app.state, "models_loaded", False),
        "redis": redis_ok,
        "environment": settings.ENV,
        "endpoints": {
            "match_role": "POST /api/ai/match-role",
            "predict_performance": "POST /api/ai/predict-performance",
            "sentiment_analysis": "POST /api/ai/sentiment-analysis",
            "chatbot": "POST /api/ai/chatbot",
            "recommendations": "POST /api/ai/recommendations",
            "analytics": "GET /api/ai/analytics",
        },
    }


# --- Direct execution ------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    logger.info(
        "Starting AI microservice in %s mode on http://%s:%s",
        settings.ENV, settings.FASTAPI_HOST, settings.FASTAPI_PORT,
    )
    uvicorn.run(
        "app.main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=(settings.ENV == "development"),
    )
