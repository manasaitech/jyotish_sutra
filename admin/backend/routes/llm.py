"""LLM Analytics — Requests, tokens, and costs breakdown."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/llm")
def get_llm_analytics(
    days: int = 30,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns LLM request counts, token usage, and cost breakdown."""

    def scalar(query: str, params: dict = None):
        try:
            result = db.execute(text(query), params or {})
            val = result.scalar()
            return val if val is not None else 0
        except Exception:
            return 0

    # Total LLM requests
    total_requests = scalar("""
        SELECT COUNT(*) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    # Breakdown by prompt_category (tab/module)
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(prompt_category, 'unknown') AS category,
                COUNT(*) AS request_count
            FROM analytics.ai_analytics
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY prompt_category
            ORDER BY request_count DESC
        """), {"days": days})
        by_category = [{"category": r[0], "count": int(r[1])} for r in result]
    except Exception:
        by_category = []

    # Breakdown by model
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(model_used, 'unknown') AS model,
                COUNT(*) AS request_count
            FROM analytics.ai_analytics
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY model_used
            ORDER BY request_count DESC
        """), {"days": days})
        by_model = [{"model": r[0], "count": int(r[1])} for r in result]
    except Exception:
        by_model = []

    # Token usage
    input_tokens = scalar("""
        SELECT COALESCE(SUM(prompt_tokens), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    output_tokens = scalar("""
        SELECT COALESCE(SUM(completion_tokens), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    total_tokens = scalar("""
        SELECT COALESCE(SUM(total_tokens), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    # Cost breakdown
    total_cost = scalar("""
        SELECT COALESCE(SUM(cost), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
    """, {"days": days})

    cost_today = scalar("""
        SELECT COALESCE(SUM(cost), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE
    """)

    cost_this_week = scalar("""
        SELECT COALESCE(SUM(cost), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - 7
    """)

    cost_this_month = scalar("""
        SELECT COALESCE(SUM(cost), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE - 30
    """)

    # Daily cost trend (last 14 days)
    try:
        result = db.execute(text("""
            SELECT
                DATE(created_at) AS day,
                COALESCE(SUM(cost), 0) AS daily_cost,
                COUNT(*) AS daily_requests
            FROM analytics.ai_analytics
            WHERE created_at >= CURRENT_DATE - 14
            GROUP BY DATE(created_at)
            ORDER BY day
        """))
        cost_trend = [
            {"date": str(r[0]), "cost": round(float(r[1]), 2), "requests": int(r[2])}
            for r in result
        ]
    except Exception:
        cost_trend = []

    return {
        "period_days": days,
        "total_requests": int(total_requests),
        "by_category": by_category,
        "by_model": by_model,
        "tokens": {
            "input": int(input_tokens),
            "output": int(output_tokens),
            "total": int(total_tokens),
        },
        "cost": {
            "today": round(float(cost_today), 2),
            "this_week": round(float(cost_this_week), 2),
            "this_month": round(float(cost_this_month), 2),
            "period_total": round(float(total_cost), 2),
        },
        "cost_trend": cost_trend,
    }
