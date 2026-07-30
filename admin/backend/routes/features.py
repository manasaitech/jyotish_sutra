"""Feature Usage — Track what users click."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/features")
def get_feature_usage(
    days: int = 30,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns feature click/usage counts from analytics events."""
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(event_type, 'unknown') AS feature,
                COUNT(*) AS click_count
            FROM analytics.user_analytics_events
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY event_type
            ORDER BY click_count DESC
            LIMIT 20
        """), {"days": days})
        features = [{"feature": r[0], "count": int(r[1])} for r in result]
    except Exception:
        features = []

    return {"period_days": days, "features": features}
