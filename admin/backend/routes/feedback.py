"""Feedback Dashboard — Star ratings and satisfaction."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from auth import get_admin_user
from db import get_db

router = APIRouter()


@router.get("/feedback")
def get_feedback_dashboard(
    days: int = 30,
    admin=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Returns feedback rating distribution and average."""

    # Rating distribution from public.prediction_feedback
    try:
        result = db.execute(text("""
            SELECT rating, COUNT(*) AS cnt
            FROM public.prediction_feedback
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY rating
            ORDER BY rating DESC
        """), {"days": days})
        distribution = {int(r[0]): int(r[1]) for r in result}
    except Exception:
        distribution = {}

    # Average rating
    try:
        result = db.execute(text("""
            SELECT COALESCE(AVG(rating), 0), COUNT(*)
            FROM public.prediction_feedback
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
        """), {"days": days})
        row = result.fetchone()
        avg_rating = round(float(row[0]), 1) if row else 0
        total_feedback = int(row[1]) if row else 0
    except Exception:
        avg_rating = 0
        total_feedback = 0

    # By tab
    try:
        result = db.execute(text("""
            SELECT tab, COUNT(*), COALESCE(AVG(rating), 0)
            FROM public.prediction_feedback
            WHERE created_at >= CURRENT_DATE - CAST(:days AS INTEGER)
            GROUP BY tab
            ORDER BY COUNT(*) DESC
        """), {"days": days})
        by_tab = [
            {"tab": r[0], "count": int(r[1]), "avg_rating": round(float(r[2]), 1)}
            for r in result
        ]
    except Exception:
        by_tab = []

    return {
        "period_days": days,
        "total_feedback": total_feedback,
        "avg_rating": avg_rating,
        "distribution": {
            "5_star": distribution.get(5, 0),
            "4_star": distribution.get(4, 0),
            "3_star": distribution.get(3, 0),
            "2_star": distribution.get(2, 0),
            "1_star": distribution.get(1, 0),
        },
        "by_tab": by_tab,
    }
