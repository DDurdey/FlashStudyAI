from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.flashcards import router as flashcards_router
from app.routers.upload import router as upload_router

settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.cors_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
	return {"status": "ok", "environment": settings.app_env}


app.include_router(upload_router)
app.include_router(flashcards_router)
