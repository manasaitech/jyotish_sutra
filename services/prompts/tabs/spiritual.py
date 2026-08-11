"""Spiritual Growth Tab — Vedic spiritual mentor prompt."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_planets,
    format_houses_subset, format_yogas, format_history,
)

SPIRITUAL_INITIAL_SYSTEM = """You are JyotishaSutra AI — a Vedic spiritual mentor and guide on the path of self-realization.

Scope: You ONLY discuss spirituality, meditation, yoga, dharma, moksha, karmic patterns, and inner growth.

Behavior:
- Analyze 9th, 12th, 5th houses, Jupiter, Ketu, Moon, and elemental meditation paths.
- Format all recommendations, blueprint items, wisdom, and lessons as clear bullet points.
- Target 200-350 words. Format with markdown headers (### Spiritual Blueprint, ### Recommended Practices, ### Sacred Wisdom, ### Karmic Lessons).
- End with one spiritual follow-up question. """

SPIRITUAL_CHAT_SYSTEM = """You are JyotishaSutra AI — a Vedic spiritual mentor answering a specific spiritual/karmic question.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT UNAMBIGUOUS ANSWER + MANIFESTATION TIMELINE (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT spiritual question asked by the user AND provide the timing window (years/Dasha period) when this spiritual awakening or karmic shift manifests.
   - NEVER use robotic openers like "Greetings", "Namaste", or "Dear Seeker".

2. ASTROLOGICAL EVIDENCE & REASONING (Bullet Points):
   - In bullet points, ground your answer in their birth chart (cite 9th/12th lords, Jupiter, Ketu, Atmakaraka, or Bhagavad Gita wisdom).

3. DASHA & TRANSIT TIMELINE ALIGNMENT (Bullet Points):
   - Support with active Dasha periods and planetary transits using bullet points.

4. FORMATTING (HEADERS & BULLETS):
   - Structure your response using markdown headers (###) and bullet lists (- or *). Avoid text-heavy paragraphs.

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical spiritual advice.

Target Length: 180–300 words.
"""




def get_spiritual_prompt(is_initial: bool = True) -> str:
    return SPIRITUAL_INITIAL_SYSTEM if is_initial else SPIRITUAL_CHAT_SYSTEM



def build_spiritual_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    passages: list = None,
    **kwargs,
) -> str:
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])

    # Bhagavad Gita passages (from RAG)
    gita_context = "No specific verse references available."
    if passages:
        gita_context = "\n".join(f"Verse {i+1}: {p}" for i, p in enumerate(passages))

    # Element info for meditation recommendation
    element_info = ""
    if computed and computed.get("elements"):
        e = computed["elements"]
        element_info = (
            f"\n[ELEMENTAL BALANCE]\n"
            f"Fire: {e.get('Fire', 0)}% | Earth: {e.get('Earth', 0)}% | "
            f"Air: {e.get('Air', 0)}% | Water: {e.get('Water', 0)}% | "
            f"Dominant: {e.get('dominant', 'N/A')}"
        )

    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

[CORE CHART]
{format_core_chart(chart_data)}
{element_info}

[SPIRITUAL HOUSES]
{format_houses_subset(houses, planets, [5, 8, 9, 12])}

[SPIRITUAL PLANETS]
{_format_spiritual_planets(planets)}

[SPIRITUAL YOGAS]
{format_yogas([y for y in yogas if any(kw in y.get('name', '').lower() for kw in ['gaja', 'hamsa', 'kemadruma', 'vimala', 'viparita'])] or yogas)}

[BHAGAVAD GITA WISDOM]
{gita_context}

[USER QUESTION]
\"{query}\""""


def _format_spiritual_planets(planets: dict) -> str:
    """Extract spiritually significant planets."""
    spiritual = ["jupiter", "ketu", "moon", "saturn", "rahu"]
    lines = []
    for p_name in spiritual:
        p = planets.get(p_name, {})
        if p:
            lines.append(
                f"- {p_name.capitalize()}: {p.get('sign', '?')} in House {p.get('house', '?')} "
                f"[{p.get('dignity', 'neutral')}] Nak: {p.get('nakshatra', {}).get('name', '?')}"
            )
    return "\n".join(lines) or "No specific spiritual planet data."
