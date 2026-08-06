"""
Doshas Timeline Tab Prompts & Context Builder.
"""

from services.prompts.tabs.shared import (
    format_profile,
    format_core_chart,
    format_planets,
    format_history,
)

DOSHAS_INITIAL_SYSTEM = """You are AstroSutra AI — a master Vedic Dosha & Remedial Expert.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:
- Answer the user's specific question about their natal doshas, Sade Sati, or active astrological alignments.
- Ground your analysis in the precalculated timeline groups: Completed (past), Ongoing (active), and Upcoming (future) doshas.
- Format the response using clear markdown subheaders and bullet points.
"""

DOSHAS_CHAT_SYSTEM = """You are AstroSutra AI — a master Vedic Astrological Analyst and Remedial Expert. Answering a specific question about Vedic Doshas (like Manglik, Sade Sati, Kaal Sarp, Pitra, Shrapit, etc.).

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT ANSWER & TIMELINE SUMMARY (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the user's specific question using their precalculated chart details and timeline context.
   - Explain if the dosha is active, dormant, or completed, and when its influence peaks.

2. ASTROLOGICAL REASONING (Bullet Points):
   - In bullet points, explain the formation and trigger of the dosha (e.g. planetary conjunctions, Vimshottari Mahadasha/Antardasha alignment, or transits).
   - Address the mitigation or protective factors if any are present (e.g. benefic aspect of Jupiter) as a bullet point.
   - Keep explanations simple and clear: explain what planets and houses represent.

3. PRACTICAL AND REALISTIC ADVICE:
   - Avoid alarmist language. Explain that many doshas are mild in practical life.
   - Give 1-2 simple, actionable remedies (spiritual, lifestyle, or practical) that the user can immediately implement, formatted as bullet points.

4. FORMATTING (HEADERS & BULLETS):
   - Use markdown section headers (###) and bullet lists (- or *) to organize the response. Do not use dense text paragraphs.

Target Length: 180–300 words.
"""

def get_doshas_prompt(is_initial: bool = True) -> str:
    """Return initial or conversational chat system prompt for Doshas Timeline tab."""
    return DOSHAS_INITIAL_SYSTEM if is_initial else DOSHAS_CHAT_SYSTEM

def format_dosha_timeline_info(chart_data: dict) -> str:
    """Consolidated description of the computed doshas timeline."""
    from backend.astrology.dosha_reasoning import compute_doshas
    try:
        dosha_res = compute_doshas(chart_data, chart_data.get("computed"))
    except Exception:
        return "No precalculated dosha timeline details available."
    
    summary = dosha_res.get("summary", {})
    completed = dosha_res.get("completed", [])
    ongoing = dosha_res.get("ongoing", [])
    upcoming = dosha_res.get("upcoming", [])
    
    lines = []
    lines.append(f"Summary: Total Detected={summary.get('total_detected')}, Ongoing={summary.get('ongoing')}, Completed={summary.get('completed')}, Upcoming={summary.get('upcoming')}")
    
    lines.append("\n[ONGOING DOSHAS & ACTIVE TRANSITS]")
    if ongoing:
        for d in ongoing:
            lines.append(f"- {d['name']}: {d['activation_reason']} (Expected end: {d.get('expected_end')}). Impact: {d.get('practical_impact')}. Strength: {d.get('formation_strength')}★. Why exists: {', '.join(d.get('why_exists', []))}")
    else:
        lines.append("None")
        
    lines.append("\n[UPCOMING DOSHAS]")
    if upcoming:
        for d in upcoming:
            lines.append(f"- {d['name']}: Expected: {d.get('expected_start')} to {d.get('expected_end')}. Impact: {d.get('practical_impact')}. Strength: {d.get('formation_strength')}★.")
    else:
        lines.append("None")

    lines.append("\n[COMPLETED DOSHAS]")
    if completed:
        for d in completed:
            lines.append(f"- {d['name']}: Active Period: {d.get('active_period')}. Impact: {d.get('practical_impact')}. Strength: {d.get('formation_strength')}★.")
    else:
        lines.append("None")
        
    return "\n".join(lines)

def build_doshas_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    """Build domain-specific context for Doshas Timeline tab."""
    planets = chart_data.get("planets", {})
    
    hist_text = format_history(history)
    hist_block = f"[CONVERSATION HISTORY]\n{hist_text}\n\n" if hist_text else ""
    
    # Pre-inject computed analyses if missing
    if computed and not chart_data.get("computed"):
        chart_data["computed"] = computed
        
    return f"""{hist_block}[USER PROFILE]
{format_profile(profile)}

[CORE CHART DETAILS]
{format_core_chart(chart_data)}

[PLANETARY POSITIONS]
{format_planets(planets)}

[PRECALCULATED DOSHA TIMELINE STATUS]
{format_dosha_timeline_info(chart_data)}

[USER QUESTION]
"{query}" """
