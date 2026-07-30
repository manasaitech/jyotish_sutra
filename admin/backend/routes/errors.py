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
                COALESCE(error_type, 'Unknown') AS error_type,
                COUNT(*) AS error_count
            FROM analytics.ai_analytics
            WHERE is_success = false
            AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY error_type
            ORDER BY error_count DESC
        """), {"days": days})
        errors = [{"type": r[0], "count": int(r[1])} for r in result]
    except Exception:
        errors = []

    total_errors = sum(e["count"] for e in errors)

    # Recent error messages
    try:
        result = db.execute(text("""
            SELECT error_type, error_message, prompt_category, created_at
            FROM analytics.ai_analytics
            WHERE is_success = false
            AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
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
