"""Geographic Insights — User distribution by country."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/geography")
def get_geographic_insights(
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns user count by country."""
    try:
        result = db.execute(text("""
            SELECT
                COALESCE(country, 'Unknown') AS country_code,
                COUNT(*) AS user_count
            FROM platform.users
            WHERE deleted_at IS NULL
            GROUP BY country
            ORDER BY user_count DESC
            LIMIT 20
        """))
        countries = [{"country": r[0], "count": int(r[1])} for r in result]
    except Exception:
        countries = []

    total = sum(c["count"] for c in countries) or 1

    for c in countries:
        c["percentage"] = round((c["count"] / total) * 100, 1)

    return {"countries": countries, "total_users": total}
