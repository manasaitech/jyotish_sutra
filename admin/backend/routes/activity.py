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
            SELECT
                al.action,
                al.resource_type,
                al.status,
                al.created_at,
                u.display_name,
                u.email
            FROM audit.audit_logs al
            LEFT JOIN platform.users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT :limit
        """), {"limit": limit})
        activities = [
            {
                "action": r[0],
                "resource": r[1] or "",
                "status": r[2],
                "time": str(r[3]),
                "user_name": r[4] or "System",
                "user_email": r[5] or "",
            }
            for r in result
        ]
    except Exception:
        activities = []

    return {"activities": activities}
