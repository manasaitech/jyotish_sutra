"""Most Asked Questions — Valuable for improving prompts."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/questions")
def get_top_questions(
    days: int = 30,
    limit: int = 20,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns the most frequently asked user questions from chat messages."""
    try:
        result = db.execute(text("""
            SELECT
                content,
                COUNT(*) AS ask_count
            FROM ai.chat_messages
            WHERE role = 'user'
            AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            AND LENGTH(content) > 10
            AND LENGTH(content) < 200
            GROUP BY content
            ORDER BY ask_count DESC
            LIMIT :limit
        """), {"days": days, "limit": limit})
        questions = [{"question": r[0], "count": int(r[1])} for r in result]
    except Exception:
        questions = []

    return {"period_days": days, "questions": questions}
