"""Platform Overview — Key metrics at a glance."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/overview")
def get_platform_overview(
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns top-level platform KPIs."""

    def scalar(query: str, params: dict = None) -> int | float:
        try:
            result = db.execute(text(query), params or {})
            val = result.scalar()
            return val if val is not None else 0
        except Exception:
            return 0

    # Active users today (users who logged in today)
    active_users_today = scalar("""
        SELECT COUNT(*) FROM platform.users
        WHERE last_login_at >= CURRENT_DATE
        AND deleted_at IS NULL
    """)

    # New users today
    new_users_today = scalar("""
        SELECT COUNT(*) FROM platform.users
        WHERE created_at >= CURRENT_DATE
        AND deleted_at IS NULL
    """)

    # Total users
    total_users = scalar("""
        SELECT COUNT(*) FROM platform.users
        WHERE deleted_at IS NULL
    """)

    # AI chats today (chat sessions created today)
    ai_chats_today = scalar("""
        SELECT COUNT(*) FROM ai.chat_sessions
        WHERE created_at >= CURRENT_DATE
    """)

    # Total chat messages today
    total_messages_today = scalar("""
        SELECT COUNT(*) FROM ai.chat_messages
        WHERE created_at >= CURRENT_DATE
    """)

    # LLM API calls today
    llm_calls_today = scalar("""
        SELECT COUNT(*) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE
    """)

    # Today's AI cost
    ai_cost_today = scalar("""
        SELECT COALESCE(SUM(cost), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE
    """)

    # Average response time today (ms)
    avg_latency_today = scalar("""
        SELECT COALESCE(AVG(latency_ms), 0) FROM analytics.ai_analytics
        WHERE created_at >= CURRENT_DATE AND latency_ms IS NOT NULL
    """)

    return {
        "active_users_today": int(active_users_today),
        "new_users_today": int(new_users_today),
        "total_users": int(total_users),
        "ai_chats_today": int(ai_chats_today),
        "total_messages_today": int(total_messages_today),
        "llm_calls_today": int(llm_calls_today),
        "ai_cost_today": round(float(ai_cost_today), 2),
        "avg_latency_ms": round(float(avg_latency_today), 1),
    }
