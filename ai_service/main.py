from app.main import app
from app.config.settings import settings

if __name__ == "__main__":
    import uvicorn
    is_dev = settings.ENV == "development"
    uvicorn.run(
        "main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=is_dev,
        workers=1,
        limit_concurrency=50,
        backlog=100
    )
