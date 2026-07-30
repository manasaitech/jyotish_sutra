"""
Tab Prompt Registry — Maps tab names to system prompts and context builders.
"""

from services.prompts.tabs.overview import get_overview_prompt, build_overview_context
from services.prompts.tabs.career import get_career_prompt, build_career_context
from services.prompts.tabs.marriage import get_marriage_prompt, build_marriage_context
from services.prompts.tabs.health import get_health_prompt, build_health_context
from services.prompts.tabs.food import get_food_prompt, build_food_context
from services.prompts.tabs.remedies import get_remedies_prompt, build_remedies_context
from services.prompts.tabs.finance import get_finance_prompt, build_finance_context
from services.prompts.tabs.personality import get_personality_prompt, build_personality_context
from services.prompts.tabs.spiritual import get_spiritual_prompt, build_spiritual_context
from services.prompts.tabs.dasha import get_dasha_prompt, build_dasha_context
from services.prompts.tabs.doshas import get_doshas_prompt, build_doshas_context

TAB_REGISTRY = {
    "overview":       {"system": get_overview_prompt,    "context": build_overview_context},
    "career":         {"system": get_career_prompt,      "context": build_career_context},
    "dasha_timeline": {"system": get_dasha_prompt,       "context": build_dasha_context},
    "dasha":          {"system": get_dasha_prompt,       "context": build_dasha_context},
    "doshas":         {"system": get_doshas_prompt,      "context": build_doshas_context},
    "marriage":       {"system": get_marriage_prompt,     "context": build_marriage_context},
    "relationships":  {"system": get_marriage_prompt,     "context": build_marriage_context},
    "relationship":   {"system": get_marriage_prompt,     "context": build_marriage_context},
    "health":         {"system": get_health_prompt,       "context": build_health_context},
    "food":           {"system": get_food_prompt,         "context": build_food_context},
    "remedies":       {"system": get_remedies_prompt,     "context": build_remedies_context},
    "finance":        {"system": get_finance_prompt,      "context": build_finance_context},
    "personality":    {"system": get_personality_prompt,  "context": build_personality_context},
    "spiritual":      {"system": get_spiritual_prompt,    "context": build_spiritual_context},
}



SIMPLE_LANGUAGE_RULE = """
UNIVERSAL RULES (apply to ALL tabs):
- Paragraph 1 MUST directly answer the user's question by name with a specific timeline. Never start with "Based on precomputed details" or "As per the evidence brief."
- Explain astrological reasoning in simple everyday words that someone with ZERO astrology knowledge can understand. When mentioning planets, always explain what they represent (e.g. "Jupiter, the planet of growth and luck"). When mentioning houses, explain them simply (e.g. "the part of your chart that governs career").
- Speak as if you are personally reading their chart right now, not quoting a report.
"""


def get_tab_system_prompt(tab: str, is_initial: bool = True, sub_tab: str = "overview") -> str:
    """Return the system prompt for a given tab, switching between initial overview and chat mode."""
    entry = TAB_REGISTRY.get(tab, TAB_REGISTRY["overview"])
    if tab == "career":
        base = entry["system"](is_initial=is_initial, sub_tab=sub_tab)
    else:
        base = entry["system"](is_initial=is_initial)
    return base + SIMPLE_LANGUAGE_RULE




def get_dasha_dosha_prompt_context(chart_data: dict, profile: dict = None) -> str:
    """Computes a brief, structured text summary of the user's active/upcoming dashas and doshas to guide LLM predictions."""
    try:
        from backend.astrology.dosha_reasoning import compute_doshas
        from services.astrology.dasha import calculate_full_dasha_package
        import datetime
        from backend.utils.date_parser import parse_date_str

        # Get planets
        planets = chart_data.get("planets", {})
        if not planets:
            return ""

        # Extract Moon longitude
        moon_data = planets.get("moon", {})
        moon_long = float(moon_data.get("longitude", 120.0)) if isinstance(moon_data, dict) else 120.0

        # Comprehensive birth date extraction to match timelines exactly and avoid fallbacks
        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        prof = profile or {}

        raw_dob = (
            meta.get("date_of_birth") or
            meta.get("birth_date") or
            meta.get("date_str") or
            chart_data.get("date_of_birth") or
            chart_data.get("birth_date") or
            chart_data.get("date_str") or
            prof.get("date_of_birth") or
            prof.get("dateOfBirth") or
            prof.get("date_str") or
            "1998-05-15"
        )
        
        try:
            if isinstance(raw_dob, datetime.date):
                birth_dt = raw_dob
            else:
                birth_dt = parse_date_str(str(raw_dob))
                if isinstance(birth_dt, datetime.datetime):
                    birth_dt = birth_dt.date()
        except Exception:
            birth_dt = datetime.date(1998, 5, 15)

        # Calculate Dasha Package
        dasha_package = calculate_full_dasha_package(moon_long, birth_dt)
        dasha_parts = []
        if dasha_package:
            curr_maha = dasha_package.get("current_mahadasha", {})
            curr_antar = dasha_package.get("current_antardasha", {})
            if curr_maha:
                dasha_parts.append(f"- Active Mahadasha: {curr_maha.get('planet_name', '')} (ends {curr_maha.get('end_date', '')})")
            if curr_antar:
                dasha_parts.append(f"- Active Antardasha: {curr_antar.get('planet_name', '')} (ends {curr_antar.get('end_date', '')})")
            
            dasha_parts.append("- Vimshottari Mahadasha Timeline:")
            for item in dasha_package.get("timeline", []):
                status_str = f" ({item.get('status', '')})" if item.get("status") else ""
                dasha_parts.append(f"  * {item.get('planet_name', '')} Mahadasha: {item.get('start_date', '')} to {item.get('end_date', '')}{status_str}")
        
        dasha_text = "\n".join(dasha_parts) if dasha_parts else "No active dasha information found."

        # Compute Doshas Timeline
        dosha_res = compute_doshas(chart_data)
        ongoing = dosha_res.get("ongoing", [])
        upcoming = dosha_res.get("upcoming", [])
        completed = dosha_res.get("completed", [])

        dosha_parts = []
        if ongoing:
            dosha_parts.append("- Ongoing / Currently Active Doshas:")
            for d in ongoing:
                severity = d.get("severity") or d.get("practical_impact") or "Minimal"
                dosha_parts.append(f"  * {d['name']} (Practical Impact: {severity}, Activation Reason: {d.get('activation_reason', '')})")
        if upcoming:
            dosha_parts.append("- Upcoming Dosha Activations:")
            for d in upcoming:
                dosha_parts.append(f"  * {d['name']} (Expected Start: {d.get('expected_start', '')}, Expected End: {d.get('expected_end', '')}, Practical Impact: {d.get('practical_impact', 'Minimal')}, Reason: {d.get('activation_reason', '')})")
        if completed:
            dosha_parts.append("- Completed/Past Doshas:")
            for d in completed:
                dosha_parts.append(f"  * {d['name']} (Active Period: {d.get('active_period', '')}, Reason: {d.get('activation_reason', '')})")

        dosha_text = "\n".join(dosha_parts) if dosha_parts else "No significant doshas detected."

        return f"""
[TIME-SCOPED ASTROLOGICAL CONTEXT (IMPORTANT FOR TIMING & PREDICTIONS)]
Use the following timeline parameters to suggest precise timings, actions to avoid, or opportunities to seize:

Vimshottari Dasha Timeline:
{dasha_text}

Vedic Dosha Timeline:
{dosha_text}
"""
    except Exception as e:
        print(f"[DashaDoshaContext Error] {e}")
        return ""


def build_tab_context(tab: str, **kwargs) -> str:
    """Build the domain-specific user prompt context for a given tab."""
    entry = TAB_REGISTRY.get(tab, TAB_REGISTRY["overview"])
    base_context = entry["context"](**kwargs)
    
    # Append Dasha & Dosha Timeline context snippet to all tabs (except dasha/doshas themselves)
    chart_data = kwargs.get("chart_data")
    profile = kwargs.get("profile")
    if chart_data and tab not in ["dasha", "dasha_timeline", "doshas"]:
        timeline_snippet = get_dasha_dosha_prompt_context(chart_data, profile)
        if timeline_snippet:
            base_context = f"{base_context}\n\n{timeline_snippet}"
            
    return base_context
