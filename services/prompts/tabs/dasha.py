"""
Dasha Timeline Tab Prompts & Context Builder.
"""

from services.prompts.tabs.shared import (
    format_profile,
    format_core_chart,
    format_planets,
    format_houses_subset,
    format_dasha_info,
    format_history,
)

DASHA_TIMELINE_INITIAL_SYSTEM = """You are AstroSutra AI — a master Vedic Dasha & Life Timing Analyst.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

### 1. Active Dasha & Timeline Reading Overview
- In bullet points, analyze the active Mahadasha and Antardasha.
- Cite the active Dasha planet's house placement, lordship, and current transit influences.

### 2. Key Life Themes & Focus Areas
- List career, financial, relationship, and personal development opportunities during this specific timing window as bullet points.

### 3. Upcoming Dasha Transition
- Detail the upcoming Mahadasha transition and the shift in karmic priorities using bullet points.

Target Length: 200–300 words.
"""

DASHA_TIMELINE_CHAT_SYSTEM = """You are AstroSutra AI — a master Vedic Dasha & Life Timing Analyst answering a specific question about Dashas or timing of events.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT UNAMBIGUOUS ANSWER + MANIFESTATION TIMELINE (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT timing/Dasha question asked by the user AND provide the timing window (years/Dasha period).
   - NEVER use robotic openers like "Greetings", "Namaste", or "As an AI astrologer".

2. ASTROLOGICAL EVIDENCE & REASONING (Bullet Points):
   - Ground your answer in their active Mahadasha, Antardasha, house placements, and transits. Present this analysis as a clear list of bullet points.

3. FORMATTING (HEADERS & BULLETS):
   - Use clear markdown section headers (###) and bullet lists (- or *) to organize the findings. Avoid dense paragraphs.

4. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical timing advice.

Target Length: 180–300 words.
"""


def get_dasha_prompt(is_initial: bool = True) -> str:
    """Return initial or conversational chat system prompt for Dasha Timeline tab."""
    return DASHA_TIMELINE_INITIAL_SYSTEM if is_initial else DASHA_TIMELINE_CHAT_SYSTEM


def build_dasha_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    """Build domain-specific context for Dasha Timeline tab."""
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})

    hist_text = format_history(history)
    hist_block = f"[CONVERSATION HISTORY]\n{hist_text}\n\n" if hist_text else ""

    return f"""{hist_block}[USER PROFILE]
{format_profile(profile)}

[CORE CHART & DASHA TIMELINE]
{format_core_chart(chart_data)}
{format_dasha_info(chart_data)}

[PLANETARY POSITIONS]
{format_planets(planets)}

[KEY HOUSES (1st, 5th, 9th, 10th)]
{format_houses_subset(houses, planets, [1, 5, 9, 10])}

[USER QUESTION]
"{query}" """
