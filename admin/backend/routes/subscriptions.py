"""Subscription Metrics — Plan distribution and conversion."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/subscriptions")
def get_subscription_metrics(
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns subscription tier distribution and conversion rates."""

    # Active subscriptions by tier
    try:
        result = db.execute(text("""
            SELECT sp.tier, COUNT(*) AS sub_count
            FROM billing.subscriptions s
            JOIN billing.subscription_plans sp ON sp.id = s.plan_id
            WHERE s.status = 'active'
            GROUP BY sp.tier
            ORDER BY sub_count DESC
        """))
        by_tier = {r[0]: int(r[1]) for r in result}
    except Exception:
        by_tier = {}

    # Total users
    try:
        result = db.execute(text("""
            SELECT COUNT(*) FROM platform.users WHERE deleted_at IS NULL
        """))
        total_users = int(result.scalar() or 0)
    except Exception:
        total_users = 0

    # Paid users (non-free)
    paid_users = sum(v for k, v in by_tier.items() if k != "free")
    free_users = total_users - paid_users

    conversion_rate = round((paid_users / max(total_users, 1)) * 100, 1)

    # Recent payments
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(SUM(amount), 0),
                COUNT(*)
            FROM billing.payments
            WHERE status = 'completed'
            AND created_at >= CURRENT_DATE - 30
        """))
        row = result.fetchone()
        revenue_30d = round(float(row[0]), 2) if row else 0
        payment_count_30d = int(row[1]) if row else 0
    except Exception:
        revenue_30d = 0
        payment_count_30d = 0

    return {
        "total_users": total_users,
        "free_users": free_users,
        "by_tier": {
            "free": by_tier.get("free", free_users),
            "standard": by_tier.get("standard", 0),
            "pro": by_tier.get("pro", 0),
            "enterprise": by_tier.get("enterprise", 0),
        },
        "paid_users": paid_users,
        "conversion_rate": conversion_rate,
        "revenue_30d": revenue_30d,
        "payment_count_30d": payment_count_30d,
    }
