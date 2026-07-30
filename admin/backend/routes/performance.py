"""API Performance — Response time analytics."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/performance")
def get_api_performance(
    days: int = 7,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns API response time statistics."""

    def scalar(query: str, params: dict = None):
        try:
            result = db.execute(text(query), params or {})
            val = result.scalar()
            return val if val is not None else 0
        except Exception:
            return 0

    avg_latency = scalar("""
        SELECT COALESCE(AVG(latency_ms), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        AND latency_ms IS NOT NULL
    """, {"days": days})

    p95_latency = scalar("""
        SELECT COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)
        FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        AND latency_ms IS NOT NULL
    """, {"days": days})

    min_latency = scalar("""
        SELECT COALESCE(MIN(latency_ms), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        AND latency_ms IS NOT NULL
    """, {"days": days})

    max_latency = scalar("""
        SELECT COALESCE(MAX(latency_ms), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        AND latency_ms IS NOT NULL
    """, {"days": days})

    failed_requests = scalar("""
        SELECT COUNT(*) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        AND is_success = false
    """, {"days": days})

    total_requests = scalar("""
        SELECT COUNT(*) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    return {
        "period_days": days,
        "avg_latency_ms": round(float(avg_latency), 1),
        "p95_latency_ms": round(float(p95_latency), 1),
        "min_latency_ms": round(float(min_latency), 1),
        "max_latency_ms": round(float(max_latency), 1),
        "failed_requests": int(failed_requests),
        "total_requests": int(total_requests),
        "success_rate": round(
            ((int(total_requests) - int(failed_requests)) / max(int(total_requests), 1)) * 100, 1
        ),
    }
