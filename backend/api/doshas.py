from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from services.memory.session import session_store
from services.astrology.chart_resolver import resolve_chart_data
from backend.astrology.dosha_reasoning import compute_doshas
from core.auth import verify_firebase_token

router = APIRouter()

class DoshaTimelineRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    birth_details: Optional[Dict[str, Any]] = None
    chart_data: Optional[Dict[str, Any]] = None

@router.post("/dosha-timeline")
def get_dosha_timeline(req: DoshaTimelineRequest, authorization: Optional[str] = Header(None)):
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
                    print(f"[Dosha] Token verification failed: {e}")

        # Check session cache first
        session = session_store.get_session(req.session_id)
        if session and "precomputed_dosha_timeline" in session:
            print(f"[DoshaTimeline API] Returning cached/precomputed timeline for session: {req.session_id}")
            return {"report": session["precomputed_dosha_timeline"]}

        chart_data, birth_details = resolve_chart_data(
            session_id=req.session_id,
            user_id=req.user_id,
            req_birth_details=req.birth_details,
            req_chart_data=req.chart_data,
        )

        if not chart_data or not isinstance(chart_data, dict) or not chart_data.get("planets"):
            raise HTTPException(
                status_code=404,
                detail="Natal chart data not found for session. Please enter birth details first."
            )

        session = session_store.get_session(req.session_id)
        computed = session.get("computed_analyses") or chart_data.get("computed")
        if not computed:
            from services.astrology.prakriti import estimate_prakriti
            from services.astrology.elements import calculate_element_distribution
            from services.astrology.lucky import calculate_lucky_attributes
            from services.astrology.planet_ranking import rank_planets
            from services.astrology.remedies_calc import generate_remedy_data

            prakriti = estimate_prakriti(chart_data)
            elements = calculate_element_distribution(chart_data)
            lucky = calculate_lucky_attributes(chart_data)
            rankings = rank_planets(chart_data)
            remedies = generate_remedy_data(chart_data, rankings)
            computed = {
                "prakriti": prakriti,
                "elements": elements,
                "lucky": lucky,
                "planet_rankings": rankings,
                "remedy_data": remedies,
            }
            session["computed_analyses"] = computed

        dosha_data = compute_doshas(chart_data, computed)
        return {"report": dosha_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DoshaTimeline Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Dosha timeline: {str(e)}")
