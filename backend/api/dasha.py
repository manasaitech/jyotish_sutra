import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from services.memory.session import session_store
from services.memory.profile_store import profile_store
from services.astrology.dasha import calculate_full_dasha_package, lookup_dasha_by_year, PLANET_METADATA
from services.astrology.chart_resolver import resolve_chart_data
from core.auth import verify_firebase_token

router = APIRouter()

class DashaTimelineRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    lookup_year: Optional[int] = None
    birth_details: Optional[Dict[str, Any]] = None
    chart_data: Optional[Dict[str, Any]] = None

@router.post("/dasha-timeline")
def get_dasha_timeline(req: DashaTimelineRequest, authorization: Optional[str] = Header(None)):
    try:
        # Resolve authenticated user_id from token if present
        if not req.user_id:
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                try:
                    claims = verify_firebase_token(token)
                    if claims and "uid" in claims:
                        req.user_id = claims["uid"]
                except Exception as e:
                    print(f"[Dasha] Token verification failed: {e}")

        chart_data, birth_details = resolve_chart_data(
            session_id=req.session_id,
            user_id=req.user_id,
            req_birth_details=req.birth_details,
            req_chart_data=req.chart_data,
        )

        session = session_store.get_session(req.session_id)

        if not chart_data or not isinstance(chart_data, dict) or not chart_data.get("planets"):
            raise HTTPException(
                status_code=404,
                detail="Natal chart data not found for session. Please enter birth details first."
            )

        # Extract Moon longitude and birth date
        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_long = moon_data.get("longitude", 120.0)

        # Comprehensive birth date parsing across all potential keys
        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        sess_bd = session.get("birth_details") or session.get("profile") or {}
        stored_bd = birth_details or {}

        raw_dob = (
            meta.get("date_of_birth") or
            meta.get("birth_date") or
            meta.get("date_str") or
            chart_data.get("date_of_birth") or
            chart_data.get("birth_date") or
            chart_data.get("date_str") or
            sess_bd.get("date_of_birth") or
            sess_bd.get("dateOfBirth") or
            sess_bd.get("date_str") or
            stored_bd.get("date_of_birth") or
            stored_bd.get("dateOfBirth") or
            stored_bd.get("date_str") or
            "2000-01-01"
        )

        try:
            if isinstance(raw_dob, datetime.date):
                dob_dt = datetime.datetime.combine(raw_dob, datetime.time.min)
            elif isinstance(raw_dob, datetime.datetime):
                dob_dt = raw_dob
            else:
                from backend.utils.date_parser import parse_date_str
                dob_dt = parse_date_str(str(raw_dob))
        except Exception:
            dob_dt = datetime.datetime(2000, 1, 1)

        # Calculate complete Dasha timeline
        dasha_package = calculate_full_dasha_package(moon_long, dob_dt.date() if isinstance(dob_dt, datetime.datetime) else dob_dt)

        # Perform optional year lookup if requested
        if req.lookup_year:
            year_info = lookup_dasha_by_year(dasha_package["timeline"], req.lookup_year)
            dasha_package["year_lookup"] = year_info

        # Add active planet guidance text
        active = dasha_package.get("current_mahadasha", {})
        p_name = active.get("planet", "jupiter")
        p_info = PLANET_METADATA.get(p_name, {})
        
        s_date = str(active.get("start_date", ""))
        e_date = str(active.get("end_date", ""))
        s_year = s_date[:4] if len(s_date) >= 4 else s_date
        e_year = e_date[:4] if len(e_date) >= 4 else e_date

        dasha_package["current_mahadasha_guidance"] = {
            "planet": p_name,
            "title": p_info.get("title", f"{active.get('planet_name', p_name.capitalize())} Dasha Period"),
            "theme": p_info.get("theme", "Transformation and Growth"),
            "summary": f"You are currently navigating your {active.get('planet_name', p_name.capitalize())} Mahadasha ({s_year} to {e_year}). This major planetary period emphasizes {', '.join(p_info.get('themes', ['karmic evolution']))}.",
            "opportunities": p_info.get("themes", ["Personal growth", "Spiritual alignment"])[:2],
            "challenges": ["Mindfulness & Karma Balance", "Patience during planetary transits"],
        }

        return dasha_package

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DashaTimeline Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Dasha timeline: {str(e)}")
