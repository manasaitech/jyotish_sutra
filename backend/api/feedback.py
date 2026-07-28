import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy import text
from db import engine

router = APIRouter()


class PredictionFeedbackRequest(BaseModel):
    birth_details: Optional[Dict[str, Any]] = None
    tab: Optional[str] = "general"
    user_prompt: Optional[str] = ""
    ai_response: Optional[str] = ""
    rating: int  # 1 to 5 stars
    user_id: Optional[str] = None
    session_id: Optional[str] = None


def _ensure_feedback_table_exists():
    """Create public.prediction_feedback table in Supabase/PostgreSQL if not exists."""
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS public.prediction_feedback (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id TEXT,
                    session_id TEXT,
                    tab TEXT NOT NULL DEFAULT 'general',
                    user_prompt TEXT,
                    ai_response TEXT,
                    rating INTEGER NOT NULL,
                    birth_details JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.commit()
    except Exception as e:
        print(f"[Feedback DB] Table check/creation note: {e}")


@router.post("/feedback")
def submit_prediction_feedback(req: PredictionFeedbackRequest):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars")

    _ensure_feedback_table_exists()

    birth_json = json.dumps(req.birth_details) if req.birth_details else "{}"
    
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO public.prediction_feedback 
                    (user_id, session_id, tab, user_prompt, ai_response, rating, birth_details, created_at)
                    VALUES (:user_id, :session_id, :tab, :user_prompt, :ai_response, :rating, CAST(:birth_details AS jsonb), :created_at)
                """),
                {
                    "user_id": req.user_id or "anonymous",
                    "session_id": req.session_id or "session",
                    "tab": req.tab or "general",
                    "user_prompt": req.user_prompt or "",
                    "ai_response": req.ai_response or "",
                    "rating": req.rating,
                    "birth_details": birth_json,
                    "created_at": datetime.utcnow()
                }
            )
            conn.commit()
        print(f"[Feedback] Saved {req.rating}⭐ prediction feedback for tab '{req.tab}' to Supabase/PostgreSQL.")
        return {"status": "success", "message": "Feedback recorded successfully!"}
    except Exception as e:
        print(f"[Feedback DB Error] Failed to insert into Supabase: {e}")
        # Fallback local file persistence so feedback is never lost
        try:
            feedback_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
            os.makedirs(feedback_dir, exist_ok=True)
            feedback_file = os.path.join(feedback_dir, "prediction_feedback_fallback.jsonl")
            record = {
                "user_id": req.user_id,
                "tab": req.tab,
                "user_prompt": req.user_prompt,
                "ai_response": req.ai_response,
                "rating": req.rating,
                "birth_details": req.birth_details,
                "created_at": datetime.utcnow().isoformat()
            }
            with open(feedback_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception as fb_err:
            print(f"[Feedback Fallback Error] {fb_err}")
            
        return {"status": "success", "message": "Feedback recorded!"}


@router.get("/feedback")
def list_prediction_feedback(limit: int = 100):
    """Retrieve prediction feedback records for fine-tuning dataset review."""
    _ensure_feedback_table_exists()
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, user_id, session_id, tab, user_prompt, ai_response, rating, birth_details, created_at FROM public.prediction_feedback ORDER BY created_at DESC LIMIT :limit"),
                {"limit": limit}
            )
            rows = [dict(row._mapping) for row in result]
            return {"count": len(rows), "data": rows}
    except Exception as e:
        return {"status": "error", "message": str(e), "data": []}
