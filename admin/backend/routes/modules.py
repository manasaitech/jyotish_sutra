"""Module Usage — Which astrology modules are being used."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/modules")
def get_module_usage(
    days: int = 30,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns usage counts per tab/module."""
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(tab_context, 'unknown') AS module,
                COUNT(*) AS usage_count
            FROM ai.chat_sessions
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY tab_context
            ORDER BY usage_count DESC
        """), {"days": days})
        rows = [{"module": r[0], "count": int(r[1])} for r in result]
    except Exception:
        rows = []

    return {"period_days": days, "modules": rows}
