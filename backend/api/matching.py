"""
Kundli Matching (Gun Milan) API Router.
"""

from fastapi import APIRouter, HTTPException
from models.request import KundliMatchRequest, PersonMatchInput
from services.astrology.horoscope import calculate_horoscope_data
from services.astrology.kundli_matching import calculate_kundli_matching
from services.prompts.matching_prompt import MATCHING_SYSTEM_PROMPT, format_matching_context
from services.memory.profile_store import profile_store
from services.llm.factory import LLMFactory

router = APIRouter()


def resolve_person_chart(person: PersonMatchInput) -> tuple:
    """Load profile from disk or calculate horoscope from birth details."""
    name = person.name or "Partner"

    if person.profile_id:
        stored = profile_store.load_profile(person.profile_id)
        if stored:
            natal = stored.get("natal_chart") or stored.get("chart_response") or stored
            if isinstance(natal, dict):
                chart_data = natal.get("natal") or natal.get("chart_summary") or natal
                profile_name = stored.get("name") or stored.get("birth_details", {}).get("fullName") or name
                return chart_data, profile_name

    # Fallback: calculate from provided birth parameters
    date_str = person.date_str or "2000-01-01"
    time_str = person.time_str or "12:00:00"
    lat = person.latitude if person.latitude is not None else 28.6139
    lon = person.longitude if person.longitude is not None else 77.2090
    tz_offset = person.timezone_offset if hasattr(person, "timezone_offset") and person.timezone_offset is not None else 5.5

    # Parse date
    date_parts = date_str.split("-")
    year = int(date_parts[0])
    month = int(date_parts[1])
    day = int(date_parts[2])

    # Parse time
    time_parts = time_str.split(":")
    hour = int(time_parts[0])
    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
    second = int(time_parts[2]) if len(time_parts) > 2 else 0

    chart_data = calculate_horoscope_data(
        year=year, month=month, day=day,
        hour=hour, minute=minute, second=second,
        lat=lat, lon=lon,
        timezone_offset=tz_offset,
    )
    return chart_data, name


@router.post("/match-kundli")
def match_kundli(req: KundliMatchRequest):
    try:
        chart_a, name_a = resolve_person_chart(req.person_a)
        chart_b, name_b = resolve_person_chart(req.person_b)

        if not chart_a or not chart_b:
            raise HTTPException(status_code=400, detail="Could not calculate birth chart for one or both partners.")

        # Run 10-point Kundli Matching engine
        match_result = calculate_kundli_matching(chart_a, chart_b, name_a, name_b)

        # Generate AI Compatibility Report
        context_text = format_matching_context(match_result)
        user_prompt = f"Please provide a comprehensive Vedic Kundli Matching report for {name_a} and {name_b}:\n\n{context_text}"

        client = LLMFactory.get_client()
        from utils.trust_note import append_trust_note

        try:
            ai_report = client.generate(MATCHING_SYSTEM_PROMPT, user_prompt, max_tokens=850)
            ai_report = append_trust_note(ai_report)
        except Exception as llm_err:
            print(f"[Matching API] LLM Generation warning: {llm_err}")
            ai_report = f"### 💖 Kundli Compatibility Summary\n\nOverall Ashtakoota Score: **{match_result.get('ashtakoota', {}).get('total_score')}/36 Gunas** ({match_result.get('ashtakoota', {}).get('verdict')}).\n\n{match_result.get('ashtakoota', {}).get('recommendation')}"
            ai_report = append_trust_note(ai_report)

        return {
            "success": True,
            "matching": match_result,
            "ai_report": ai_report,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
