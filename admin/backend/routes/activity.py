"""Admin Activity Feed — Recent platform events."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/activity")
def get_activity_feed(
    limit: int = 30,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns recent audit log entries as an activity feed."""
    try:
        result = db.execute(text("""
            SELECT action, resource_type, status, created_at, display_name, email FROM (
                SELECT 
                    'User Signup' AS action,
                    'platform.users' AS resource_type,
                    'success' AS status,
                    created_at,
                    display_name,
                    email
                FROM platform.users
                WHERE deleted_at IS NULL
                
                UNION ALL
                
                SELECT 
                    'Chat Started' AS action,
                    'ai.chat_sessions' AS resource_type,
                    'success' AS status,
                    s.created_at,
                    u.display_name,
                    u.email
                FROM ai.chat_sessions s
                JOIN platform.users u ON u.id = s.user_id
                WHERE s.deleted_at IS NULL
                
                UNION ALL
                
                SELECT 
                    'Payment Received' AS action,
                    'billing.payments' AS resource_type,
                    status,
                    p.created_at,
                    u.display_name,
                    u.email
                FROM billing.payments p
                JOIN platform.users u ON u.id = p.user_id
                
                UNION ALL
                
                SELECT 
                    'Subscription Activated' AS action,
                    'billing.subscriptions' AS resource_type,
                    status,
                    s.created_at,
                    u.display_name,
                    u.email
                FROM billing.subscriptions s
                JOIN platform.users u ON u.id = s.user_id
            ) q
            ORDER BY created_at DESC
            LIMIT :limit
        """), {"limit": limit})
        activities = [
            {
                "action": r[0],
                "resource": r[1] or "",
                "status": r[2],
                "time": str(r[3]),
                "user_name": r[4] or "System Seeker",
                "user_email": r[5] or "",
            }
            for r in result
        ]
    except Exception:
        activities = []

    return {"activities": activities}
