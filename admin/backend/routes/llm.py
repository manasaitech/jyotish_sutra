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
        SELECT COUNT(*) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
    """, {"days": days})

    # Breakdown by category (tab_context from session)
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(s.tab_context, 'general') AS category,
                COUNT(*) AS request_count
            FROM ai.chat_messages m
            LEFT JOIN ai.chat_sessions s ON m.session_id = s.id
            WHERE m.role = 'assistant'
              AND m.created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
            GROUP BY s.tab_context
            ORDER BY request_count DESC
        """), {"days": days})
        by_category = [{"category": r[0], "count": int(r[1])} for r in result]
    except Exception:
        by_category = []

    # Breakdown by model
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(model_used, 'claude-sonnet-4-5') AS model,
                COUNT(*) AS request_count
            FROM ai.chat_messages
            WHERE role = 'assistant'
              AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
            GROUP BY COALESCE(model_used, 'claude-sonnet-4-5')
            ORDER BY request_count DESC
        """), {"days": days})
        by_model = [{"model": r[0], "count": int(r[1])} for r in result]
    except Exception:
        by_model = []

    # Token usage (real if populated, simulated fallback if null)
    input_tokens = scalar("""
        SELECT COALESCE(SUM(COALESCE(prompt_tokens, 2200)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
    """, {"days": days})

    output_tokens = scalar("""
        SELECT COALESCE(SUM(COALESCE(completion_tokens, LENGTH(content) / 4)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
    """, {"days": days})

    total_tokens = scalar("""
        SELECT COALESCE(SUM(COALESCE(total_tokens, 2200 + LENGTH(content) / 4)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
    """, {"days": days})

    # Cost breakdown (real if populated, simulated fallback if null)
    total_cost = scalar("""
        SELECT COALESCE(SUM(COALESCE(cost, 0.55 + LENGTH(content) * 0.0003)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
    """, {"days": days})

    cost_today = scalar("""
        SELECT COALESCE(SUM(COALESCE(cost, 0.55 + LENGTH(content) * 0.0003)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE
    """)

    cost_this_week = scalar("""
        SELECT COALESCE(SUM(COALESCE(cost, 0.55 + LENGTH(content) * 0.0003)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    """)

    cost_this_month = scalar("""
        SELECT COALESCE(SUM(COALESCE(cost, 0.55 + LENGTH(content) * 0.0003)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    """)

    # Daily cost trend (last 14 days)
    try:
        result = db.execute(text("""
            SELECT
                DATE(created_at) AS day,
                COALESCE(SUM(COALESCE(cost, 0.55 + LENGTH(content) * 0.0003)), 0) AS daily_cost,
                COUNT(*) AS daily_requests
            FROM ai.chat_messages
            WHERE role = 'assistant' AND created_at >= CURRENT_DATE - INTERVAL '14 days'
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
