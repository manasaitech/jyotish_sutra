"""Error Dashboard — Track failures."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/errors")
def get_error_dashboard(
    days: int = 7,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns error counts by type from AI analytics."""
    try:
        result = db.execute(text("""
            SELECT
                'API Connection Error' AS error_type,
                COUNT(*) AS error_count
            FROM ai.chat_messages
            WHERE role = 'assistant'
              AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
              AND (content LIKE '%cosmos is currently clouded%' OR content LIKE '%connection issues%')
            GROUP BY 1
            ORDER BY error_count DESC
        """), {"days": days})
        errors = [{"type": r[0], "count": int(r[1])} for r in result]
    except Exception:
        errors = []

    total_errors = sum(e["count"] for e in errors)

    # Recent error messages
    try:
        result = db.execute(text("""
            SELECT 
                'API Connection Error' AS error_type, 
                content AS error_message, 
                'astrology' AS prompt_category, 
                created_at
            FROM ai.chat_messages
            WHERE role = 'assistant'
              AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
              AND (content LIKE '%cosmos is currently clouded%' OR content LIKE '%connection issues%')
            ORDER BY created_at DESC
            LIMIT 10
        """), {"days": days})
        recent = [
            {
                "type": r[0] or "Unknown",
                "message": (r[1] or "")[:200],
                "module": r[2] or "unknown",
                "time": str(r[3]),
            }
            for r in result
        ]
    except Exception:
        recent = []

    return {
        "period_days": days,
        "total_errors": total_errors,
        "by_type": errors,
        "recent_errors": recent,
    }
