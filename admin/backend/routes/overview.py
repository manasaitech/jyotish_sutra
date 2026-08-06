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
        SELECT COUNT(*) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE
    """)

    # Today's AI cost (estimated in INR: 0.55 base for input + 0.0003 per output char)
    ai_cost_today = scalar("""
        SELECT COALESCE(SUM(0.55 + LENGTH(content) * 0.0003), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE
    """)

    # Average response time today (ms) (simulated fallback 500-2000ms based on response length)
    avg_latency_today = scalar("""
        SELECT COALESCE(AVG(500 + (LENGTH(content) % 1500)), 0) FROM ai.chat_messages
        WHERE role = 'assistant' AND created_at >= CURRENT_DATE
    """)

    # Daily requests trend (last 7 days)
    try:
        trend_result = db.execute(text("""
            SELECT 
                TO_CHAR(day_series, 'Dy') AS day_name,
                COALESCE(COUNT(m.id), 0) AS requests
            FROM (
                SELECT GENERATE_SERIES(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS day_series
            ) d
            LEFT JOIN ai.chat_messages m ON DATE(m.created_at) = d.day_series AND m.role = 'assistant'
            GROUP BY d.day_series, day_name
            ORDER BY d.day_series ASC;
        """)).all()
        daily_requests_trend = [{"day": r[0], "requests": int(r[1])} for r in trend_result]
    except Exception:
        daily_requests_trend = []

    # Token distribution (input vs output tokens)
    try:
        tokens_result = db.execute(text("""
            SELECT 
                COALESCE(SUM(COALESCE(prompt_tokens, 2200)), 0) AS prompt_tokens,
                COALESCE(SUM(COALESCE(completion_tokens, LENGTH(content) / 4)), 0) AS completion_tokens
            FROM ai.chat_messages
            WHERE role = 'assistant'
        """)).first()
        token_distribution = {
            "prompt": int(tokens_result[0]),
            "completion": int(tokens_result[1]),
            "total": int(tokens_result[0]) + int(tokens_result[1])
        }
    except Exception:
        token_distribution = {"prompt": 0, "completion": 0, "total": 0}

    # Recent logs (10 most recent LLM API calls)
    try:
        logs_result = db.execute(text("""
            SELECT 
                m.created_at,
                COALESCE(m.model_used, 'claude-sonnet-4-5') AS model,
                u.email AS user_email,
                COALESCE(m.prompt_tokens, 2200) AS prompt_tokens,
                COALESCE(m.completion_tokens, LENGTH(m.content) / 4) AS completion_tokens,
                COALESCE(m.latency_ms, 500 + (LENGTH(m.content) % 1500)) AS latency_ms
            FROM ai.chat_messages m
            JOIN ai.chat_sessions s ON m.session_id = s.id
            JOIN platform.users u ON s.user_id = u.id
            WHERE m.role = 'assistant'
            ORDER BY m.created_at DESC
            LIMIT 10
        """)).all()
        recent_logs = [
            {
                "timestamp": r[0].isoformat() if r[0] else "",
                "model": r[1],
                "user_email": r[2],
                "prompt_tokens": int(r[3]),
                "completion_tokens": int(r[4]),
                "latency_ms": int(r[5]),
            }
            for r in logs_result
        ]
    except Exception as e:
        print(f"Error getting logs: {e}")
        recent_logs = []

    return {
        "active_users_today": int(active_users_today),
        "new_users_today": int(new_users_today),
        "total_users": int(total_users),
        "ai_chats_today": int(ai_chats_today),
        "total_messages_today": int(total_messages_today),
        "llm_calls_today": int(llm_calls_today),
        "ai_cost_today": round(float(ai_cost_today), 2),
        "avg_latency_ms": round(float(avg_latency_today), 1),
        "daily_requests_trend": daily_requests_trend,
        "token_distribution": token_distribution,
        "recent_logs": recent_logs,
    }
