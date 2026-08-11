import os
import sys
from dotenv import load_dotenv

# Ensure both backend directory and project root are in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, project_root)

# Load environment variables from .env file before other imports
load_dotenv(os.path.join(project_root, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chart import router as chart_router
from api.chat import router as chat_router
from api.tab_chat import router as tab_chat_router
from api.profile import router as profile_router
from api.matching import router as matching_router
from api.dasha import router as dasha_router
from api.doshas import router as dosha_router
from api.auth import router as auth_router
from api.billing import router as billing_router
from api.contact import router as contact_router
from api.feedback import router as feedback_router
from api.campaign import router as campaign_router

IS_PRODUCTION = os.getenv("ENV") == "production"

app = FastAPI(
    title="JyotishaSutra AI API",
    description="Ancient Wisdom meets Modern Intelligence — Horoscope Computation and RAG-Gita Guided Chat Engine.",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

frontend_url_env = os.environ.get("FRONTEND_URL")

origins = [
    "https://jyotishasutraai.onrender.com",
    "https://jyotishasutraai.onrender.com/",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3000/",
    "http://127.0.0.1:3000/",
]

if frontend_url_env:
    raw_env = frontend_url_env.strip()
    clean_env = raw_env.rstrip("/")
    if clean_env not in origins:
        origins.append(clean_env)
    if (clean_env + "/") not in origins:
        origins.append(clean_env + "/")

# Enable CORS for React + Vite frontend server & JyotishaSutra domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*jyotishasutra.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(chart_router, prefix="/api", tags=["Astrology & Timezone"])
app.include_router(chat_router, prefix="/api", tags=["Vedic Chat & RAG"])
app.include_router(tab_chat_router, prefix="/api", tags=["Tab-Scoped Chat"])
app.include_router(profile_router, prefix="/api", tags=["Profile"])
app.include_router(matching_router, prefix="/api", tags=["Kundli Matching"])
app.include_router(dasha_router, prefix="/api", tags=["Dasha Timeline"])
app.include_router(dosha_router, prefix="/api", tags=["Dosha Timeline"])
app.include_router(auth_router, prefix="/api", tags=["Firebase Authentication"])
app.include_router(billing_router, prefix="/api", tags=["Billing & Payments"])
app.include_router(contact_router, prefix="/api", tags=["Contact Us"])
app.include_router(feedback_router, prefix="/api", tags=["Prediction Feedback"])
app.include_router(campaign_router, prefix="/api", tags=["Campaigns & Promotions"])

@app.on_event("startup")
def on_startup():
    try:
        from api.feedback import _ensure_feedback_table_exists
        _ensure_feedback_table_exists()
    except Exception as e:
        print(f"[Startup DB] Note: {e}")

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "KundliGPT Astrological Compute Engine",
        "version": "1.0.0"
    }

@app.get("/api/health/db")
def database_health():
    """Verify database connectivity with a simple SELECT 1 query."""
    from sqlalchemy import text
    from db import engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "message": "Database Connection is Healthy!"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database Connection Failed: {str(e)}"
        }


# Reload trigger comment v4


