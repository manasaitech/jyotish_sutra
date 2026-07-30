"""
Profile API — Anonymous persistent profile management.

Endpoints for looking up, deleting, and recalculating stored user profiles.
"""

import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from models.response import ProfileResponse
from services.memory.profile_store import profile_store
from services.memory.session import session_store
from services.astrology.horoscope import calculate_horoscope_data
from api.chart import find_timezone_offset
from backend.utils.date_parser import parse_date_str, parse_time_str
from core.auth import verify_firebase_token

from services.astrology.prakriti import estimate_prakriti
from services.astrology.elements import calculate_element_distribution
from services.astrology.lucky import calculate_lucky_attributes
from services.astrology.planet_ranking import rank_planets
from services.astrology.remedies_calc import generate_remedy_data

router = APIRouter()

def precalculate_session_timelines(user_id: str, chart_data: dict, birth_details: dict, computed: dict):
    """Precalculate Dasha and Dosha timelines and store them in the session cache."""
    try:
        from services.astrology.dasha import calculate_full_dasha_package, PLANET_METADATA
        from backend.astrology.dosha_reasoning import compute_doshas
        import datetime
        from backend.utils.date_parser import parse_date_str

        planets = chart_data.get("planets", {})
        if not planets:
            return

        moon_data = planets.get("moon", {})
        moon_long = float(moon_data.get("longitude", 120.0)) if isinstance(moon_data, dict) else 120.0

        raw_dob = birth_details.get("date_of_birth") or "2000-01-01"
        try:
            birth_dt = parse_date_str(str(raw_dob))
        except Exception:
            birth_dt = datetime.date(2000, 1, 1)

        dob_date = birth_dt.date() if isinstance(birth_dt, datetime.datetime) else birth_dt

        # Calculate timelines
        dasha_package = calculate_full_dasha_package(moon_long, dob_date)
        
        # Add active planet guidance text to the precalculated package
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
        
        dosha_timeline = compute_doshas(chart_data, computed)

        sess = session_store.get_session(user_id)
        sess["precomputed_dasha_package"] = dasha_package
        sess["precomputed_dosha_timeline"] = dosha_timeline
        print(f"[Precalculation] Hydrated Dasha and Dosha timelines for user {user_id}")
    except Exception as e:
        print(f"[Precalculation Error] Failed to precompute timelines for {user_id}: {e}")


def resolve_user_id(user_id: str, authorization: Optional[str] = None) -> str:
    """Check Authorization token and return verified uid if present, else original user_id."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            claims = verify_firebase_token(token)
            if claims and "uid" in claims:
                firebase_uid = claims["uid"]
                if not user_id or user_id == "self" or user_id == firebase_uid:
                    return firebase_uid
        except Exception as e:
            print(f"[Profile] Token verification failed: {e}")
    return user_id


@router.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str, authorization: Optional[str] = Header(None)):
    """
    Look up a stored profile by anonymous user ID or verified Firebase UID.

    If found, hydrates the in-memory session store so /api/chat works
    seamlessly without re-computing the chart.
    """
    user_id = resolve_user_id(user_id, authorization)
    profile = profile_store.load_profile(user_id)


    if not profile:
        return {
            "exists": False,
            "birth_details": None,
            "chart_summary": None,
        }

    # Hydrate in-memory session so /api/chat can use it immediately
    natal_chart = profile.get("natal_chart")
    birth_details = profile.get("birth_details", {})

    chart_summary = profile.get("chart_response") or {}

    if natal_chart:
        # Reconstruct the chart_data format the session/prompt system expects
        # Support both new (natal/dynamic split) and legacy flat formats
        if "natal" in natal_chart:
            chart_data = natal_chart["natal"]
        else:
            chart_data = natal_chart

        # Recalculate dynamic portions (current transits, Sade Sati)
        dynamic = _recalculate_dynamic(chart_data, birth_details)
        if dynamic:
            # Merge dynamic doshas into chart_data for prompt compatibility
            doshas = chart_data.get("doshas", {})
            doshas.update(dynamic.get("doshas", {}))
            chart_data["doshas"] = doshas

        session_store.save_chart(user_id, chart_data)
        sess = session_store.get_session(user_id)
        sess["profile"] = birth_details

        # Ensure computed_analyses is available in session
        computed = chart_data.get("computed") or chart_summary.get("computed")
        
        # Self-healing: Recalculate full chart if planets or computed values are missing
        if not computed or not chart_summary.get("planets"):
            try:
                prakriti = estimate_prakriti(chart_data)
                elements = calculate_element_distribution(chart_data)
                lucky = calculate_lucky_attributes(chart_data)
                
                from services.astrology.planet_ranking import rank_planets
                from services.astrology.remedies_calc import generate_remedy_data
                rankings = rank_planets(chart_data)
                remedies = generate_remedy_data(chart_data, rankings)
                
                computed = {
                    "prakriti": prakriti,
                    "elements": elements,
                    "lucky": lucky,
                    "planet_rankings": rankings,
                    "remedy_data": remedies,
                }
                
                # Calculate current Vimshottari Mahadasha planet
                planets = chart_data.get("planets", {})
                moon_data = planets.get("moon", {})
                moon_long = moon_data.get("longitude", 120.0)
                
                from services.astrology.dasha import calculate_full_dasha_package
                try:
                    import datetime
                    from backend.utils.date_parser import parse_date_str
                    raw_dob = birth_details.get("date_of_birth") or "2000-01-01"
                    dob_dt = parse_date_str(str(raw_dob))
                    dasha_package = calculate_full_dasha_package(
                        moon_long, 
                        dob_dt.date() if isinstance(dob_dt, datetime.datetime) else dob_dt
                    )
                    active_dasha = dasha_package.get("current_mahadasha", {})
                    current_dasha_planet = active_dasha.get("planet", "jupiter").capitalize()
                except Exception:
                    current_dasha_planet = "Jupiter"
                
                meta = chart_data.get("metadata", {})
                chart_summary = {
                    "name": birth_details.get("name", "Seeker"),
                    "ascendant_sign": meta.get("ascendant_sign", ""),
                    "moon_sign": meta.get("moon_sign", ""),
                    "nakshatra": meta.get("nakshatra", ""),
                    "pada": meta.get("pada", 1),
                    "current_dasha": current_dasha_planet,
                    "metadata": meta,
                    "houses": chart_data.get("houses", {}),
                    "planets": chart_data.get("planets", {}),
                    "yogas": chart_data.get("yogas", []),
                    "doshas": chart_data.get("doshas", {}),
                    "raw_positions": chart_data.get("planets", {}),
                    "computed": computed,
                }
                
                # Resave the updated complete profile back to postgres
                new_natal = _extract_natal(chart_data, computed=computed)
                profile_store.save_profile(
                    user_id=user_id,
                    birth_details=birth_details,
                    natal_chart=new_natal,
                    chart_response=chart_summary
                )
                print(f"[Profile GET] Successfully repaired and persisted profile for {user_id}")
            except Exception as repair_err:
                print(f"[Profile GET] Suppressed dynamic repair failure: {repair_err}")
                
        if not computed:
            prakriti = estimate_prakriti(chart_data)
            elements = calculate_element_distribution(chart_data)
            lucky = calculate_lucky_attributes(chart_data)
            from services.astrology.planet_ranking import rank_planets
            from services.astrology.remedies_calc import generate_remedy_data
            rankings = rank_planets(chart_data)
            remedies = generate_remedy_data(chart_data, rankings)
            computed = {
                "prakriti": prakriti,
                "elements": elements,
                "lucky": lucky,
                "planet_rankings": rankings,
                "remedy_data": remedies,
            }
        sess["computed_analyses"] = computed
        precalculate_session_timelines(user_id, chart_data, birth_details, computed)

    return {
        "exists": True,
        "birth_details": birth_details,
        "chart_summary": chart_summary,
    }


class ProfileUpdateRequest(BaseModel):
    name: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    latitude: float
    longitude: float
    timezone_offset: Optional[float] = 5.5
    gender: Optional[str] = "male"
    relationship_type: Optional[str] = "self"

@router.put("/profile/{profile_id}")
def update_profile(profile_id: str, req: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    """Update an existing profile and recalculate its chart details in place."""
    owner_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            claims = verify_firebase_token(token)
            if claims and "uid" in claims:
                owner_id = claims["uid"]
        except Exception as e:
            print(f"[Profile Update] Token verification failed: {e}")

    try:
        lat = req.latitude
        lon = req.longitude
        _, offset = find_timezone_offset(lat, lon, req.date_of_birth or "2000-01-01")

        dt = parse_date_str(req.date_of_birth or "2000-01-01")
        tm = parse_time_str(req.time_of_birth or "12:00:00")

        # Recalculate horoscope chart
        chart_data = calculate_horoscope_data(
            year=dt.year, month=dt.month, day=dt.day,
            hour=tm.hour, minute=tm.minute, second=tm.second,
            lat=lat, lon=lon, timezone_offset=offset
        )

        prakriti = estimate_prakriti(chart_data)
        elements = calculate_element_distribution(chart_data)
        lucky = calculate_lucky_attributes(chart_data)
        from services.astrology.planet_ranking import rank_planets
        from services.astrology.remedies_calc import generate_remedy_data
        rankings = rank_planets(chart_data)
        remedies = generate_remedy_data(chart_data, rankings)

        computed = {
            "prakriti": prakriti,
            "elements": elements,
            "lucky": lucky,
            "planet_rankings": rankings,
            "remedy_data": remedies,
        }

        # Calculate current Vimshottari Mahadasha planet
        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_long = moon_data.get("longitude", 120.0)

        from services.astrology.dasha import calculate_full_dasha_package
        try:
            dasha_package = calculate_full_dasha_package(
                moon_long, 
                dt.date() if isinstance(dt, datetime.datetime) else dt
            )
            active_dasha = dasha_package.get("current_mahadasha", {})
            current_dasha_planet = active_dasha.get("planet", "jupiter").capitalize()
        except Exception as dasha_err:
            print(f"[Profile Update] Dasha calculation failed: {dasha_err}")
            current_dasha_planet = "Jupiter"

        natal = _extract_natal(chart_data, computed=computed)
        meta = chart_data.get("metadata", {})

        chart_response = {
            "name": req.name,
            "ascendant_sign": meta.get("ascendant_sign", ""),
            "moon_sign": meta.get("moon_sign", ""),
            "nakshatra": meta.get("nakshatra", ""),
            "pada": meta.get("pada", 1),
            "current_dasha": current_dasha_planet,
            "metadata": meta,
            "houses": chart_data.get("houses", {}),
            "planets": chart_data.get("planets", {}),
            "yogas": chart_data.get("yogas", []),
            "doshas": chart_data.get("doshas", {}),
            "raw_positions": chart_data.get("planets", {}),
            "computed": computed,
        }

        birth_details = {
            "name": req.name,
            "date_of_birth": req.date_of_birth,
            "time_of_birth": req.time_of_birth,
            "latitude": lat,
            "longitude": lon,
            "timezone_offset": offset,
            "gender": req.gender,
            "relationship": req.relationship_type,
        }

        # Update in database in-place
        profile_store.save_profile(
            user_id=profile_id,
            birth_details=birth_details,
            natal_chart=natal,
            chart_response=chart_response,
            owner_id=owner_id
        )

        # Clear session and history to trigger fresh reload
        session_store.clear_session(profile_id)
        precalculate_session_timelines(profile_id, chart_data, birth_details, computed)

        return {
            "success": True,
            "profile_id": profile_id,
            "natal": chart_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/profile/{user_id}")
def delete_profile(user_id: str, authorization: Optional[str] = Header(None)):
    """Delete a stored profile so the user can re-enter birth details."""
    user_id = resolve_user_id(user_id, authorization)
    deleted = profile_store.delete_profile(user_id)
    # Also clear the in-memory session
    session_store.clear_session(user_id)
    return {"deleted": deleted}


@router.post("/profile/{user_id}/recalculate")
def recalculate_chart(user_id: str, authorization: Optional[str] = Header(None)):
    """
    Force-recalculate the natal chart from stored birth details.

    Use when chart data might be corrupted or a manual refresh is requested.
    """
    user_id = resolve_user_id(user_id, authorization)
    profile = profile_store.load_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user ID.")

    birth = profile.get("birth_details", {})
    if not birth.get("date_of_birth") or not birth.get("time_of_birth"):
        raise HTTPException(status_code=400, detail="Stored birth details are incomplete.")

    try:
        # Re-resolve timezone
        lat = birth.get("latitude", 0.0)
        lon = birth.get("longitude", 0.0)
        _, offset = find_timezone_offset(lat, lon, birth["date_of_birth"])

        # Parse date and time
        dt = parse_date_str(birth["date_of_birth"])
        tm = parse_time_str(birth["time_of_birth"])

        # Recalculate
        chart_data = calculate_horoscope_data(
            year=dt.year, month=dt.month, day=dt.day,
            hour=tm.hour, minute=tm.minute, second=tm.second,
            lat=lat, lon=lon, timezone_offset=offset
        )

        prakriti = estimate_prakriti(chart_data)
        elements = calculate_element_distribution(chart_data)
        lucky = calculate_lucky_attributes(chart_data)
        
        from services.astrology.planet_ranking import rank_planets
        from services.astrology.remedies_calc import generate_remedy_data
        rankings = rank_planets(chart_data)
        remedies = generate_remedy_data(chart_data, rankings)

        computed = {
            "prakriti": prakriti,
            "elements": elements,
            "lucky": lucky,
            "planet_rankings": rankings,
            "remedy_data": remedies,
        }

        # Calculate current Vimshottari Mahadasha planet
        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_long = moon_data.get("longitude", 120.0)

        from services.astrology.dasha import calculate_full_dasha_package
        try:
            dasha_package = calculate_full_dasha_package(
                moon_long, 
                dt.date() if isinstance(dt, datetime.datetime) else dt
            )
            active_dasha = dasha_package.get("current_mahadasha", {})
            current_dasha_planet = active_dasha.get("planet", "jupiter").capitalize()
        except Exception as dasha_err:
            print(f"[Recalculate] Dasha calculation failed: {dasha_err}")
            current_dasha_planet = "Jupiter"

        # Extract natal vs dynamic
        natal = _extract_natal(chart_data, computed=computed)
        meta = chart_data.get("metadata", {})

        chart_response = {
            "name": birth.get("name", "Seeker"),
            "ascendant_sign": meta.get("ascendant_sign", ""),
            "moon_sign": meta.get("moon_sign", ""),
            "nakshatra": meta.get("nakshatra", ""),
            "pada": meta.get("pada", 1),
            "current_dasha": current_dasha_planet,
            "metadata": meta,
            "houses": chart_data.get("houses", {}),
            "planets": chart_data.get("planets", {}),
            "yogas": chart_data.get("yogas", []),
            "doshas": chart_data.get("doshas", {}),
            "raw_positions": chart_data.get("planets", {}),
            "computed": computed,
        }

        # Update persistent profile
        profile_store.save_profile(
            user_id=user_id,
            birth_details=birth,
            natal_chart=natal,
            chart_response=chart_response,
        )

        # Hydrate in-memory session
        session_store.save_chart(user_id, chart_data)
        sess = session_store.get_session(user_id)
        sess["profile"] = birth
        # Clear old chat history on recalculation
        sess["history"] = []
        precalculate_session_timelines(user_id, chart_data, birth, computed)

        return {
            "recalculated": True,
            "chart_summary": chart_response,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_natal(chart_data: dict, computed: dict = None) -> dict:
    """Extract only the static natal portion from full chart data."""
    natal_doshas = {}
    all_doshas = chart_data.get("doshas", {})
    # Manglik and Kaal Sarp are natal; Sade Sati is transit-dependent
    if "manglik" in all_doshas:
        natal_doshas["manglik"] = all_doshas["manglik"]
    if "kaal_sarp" in all_doshas:
        natal_doshas["kaal_sarp"] = all_doshas["kaal_sarp"]

    res = {
        "natal": {
            "metadata": chart_data.get("metadata", {}),
            "planets": chart_data.get("planets", {}),
            "houses": chart_data.get("houses", {}),
            "yogas": chart_data.get("yogas", []),
            "doshas": natal_doshas,
        }
    }
    if computed:
        res["natal"]["computed"] = computed
    return res


def _recalculate_dynamic(chart_data: dict, birth_details: dict) -> dict | None:
    """Recalculate transit-dependent data (Sade Sati, current transits)."""
    try:
        from services.astrology.swiss_ephemeris import datetime_to_jd, get_sidereal_positions
        from services.astrology.doshas import check_sade_sati

        today = datetime.date.today()
        jd_today = datetime_to_jd(today.year, today.month, today.day, 12.0)
        transit_positions = get_sidereal_positions(jd_today)
        saturn_transit = transit_positions.get("saturn", 0.0)

        # Get Moon's natal longitude from chart data
        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_longitude = moon_data.get("degree", 0.0)

        # If moon degree is relative to sign, reconstruct absolute longitude
        # The check_sade_sati function expects absolute sidereal longitudes
        # For safety, use degree as-is (it should be absolute from the ephemeris)

        sade_sati = check_sade_sati(moon_longitude, saturn_transit)

        return {
            "transits": {"saturn": saturn_transit},
            "doshas": {"sade_sati": sade_sati},
        }
    except Exception as e:
        print(f"[Profile] Dynamic recalculation failed: {e}")
        return None
