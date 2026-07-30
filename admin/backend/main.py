"""
AstroSutra Admin Analytics Dashboard — FastAPI Backend.

Runs on port 8001, completely isolated from the main backend (port 8000).
Connects to the same Supabase PostgreSQL database via shared DATABASE_URL.
"""

import os
import sys

# Ensure admin backend and project root are in python path
admin_backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(admin_backend_dir, "..", ".."))
sys.path.insert(0, admin_backend_dir)
sys.path.insert(0, os.path.join(project_root, "backend"))
sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv(os.path.join(project_root, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.overview import router as overview_router
from routes.modules import router as modules_router
from routes.llm import router as llm_router
from routes.performance import router as performance_router
from routes.features import router as features_router
from routes.questions import router as questions_router
from routes.feedback import router as feedback_router
from routes.subscriptions import router as subscriptions_router
from routes.geography import router as geography_router
from routes.errors import router as errors_router
from routes.activity import router as activity_router

app = FastAPI(
    title="AstroSutra Admin Analytics API",
    description="Secure admin-only analytics dashboard backend.",
    version="1.0.0",
)

# CORS — only allow the admin frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all analytics routes under /api/admin
app.include_router(overview_router, prefix="/api/admin", tags=["Platform Overview"])
app.include_router(modules_router, prefix="/api/admin", tags=["Module Usage"])
app.include_router(llm_router, prefix="/api/admin", tags=["LLM Analytics"])
app.include_router(performance_router, prefix="/api/admin", tags=["API Performance"])
app.include_router(features_router, prefix="/api/admin", tags=["Feature Usage"])
app.include_router(questions_router, prefix="/api/admin", tags=["Top Questions"])
app.include_router(feedback_router, prefix="/api/admin", tags=["Feedback"])
app.include_router(subscriptions_router, prefix="/api/admin", tags=["Subscriptions"])
app.include_router(geography_router, prefix="/api/admin", tags=["Geography"])
app.include_router(errors_router, prefix="/api/admin", tags=["Errors"])
app.include_router(activity_router, prefix="/api/admin", tags=["Activity Feed"])


@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "AstroSutra Admin Analytics API",
        "version": "1.0.0",
    }


@app.get("/api/admin/health")
def health_check():
    from sqlalchemy import text
    from db import engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "message": "Admin DB Connection Healthy"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
