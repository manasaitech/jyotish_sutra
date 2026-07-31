"""Overview Tab — Concise overall personality and chart summary prompt."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_planets,
    format_all_houses, format_houses_subset, format_yogas, format_doshas, format_history,
)

OVERVIEW_INITIAL_SYSTEM = """You are AstroSutra AI — a seasoned Vedic astrologer providing a concise, structured overall birth chart overview.

Scope: You ONLY discuss the user's overall chart summary, key placements, personality snapshot, and current Dasha effects.

Behavior:
- Open with the single most defining feature of this chart — something genuinely uncommon.
- Cover: Ascendant personality, Moon mind, Sun core identity, strongest/weakest planets, active yogas, doshas, current Dasha influence.
- Keep it structured with markdown headers (Lagna, Moon, Sun, Key Planets). Target 200-350 words.
- NO generic greetings. Every claim must cite specific placements.
- End with one insightful follow-up question."""

OVERVIEW_CHAT_SYSTEM = """You are AstroSutra AI — a master Vedic Astrologer answering a specific user question.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT PERSONAL ADDRESS & PREDICTION (Line 1):
   - Start immediately by addressing the user by their name on line 1 (e.g. "[Name], your chart indicates that the key shift manifests between [start_date] and [end_date].").
   - Provide the core prediction and specific timing window (years/dates) in the very first sentence.
   - NEVER use robotic openers like "Greetings", "Namaste", "Dear Seeker", or "As an AI astrologer".

2. DASHA & TRANSIT TIMELINE ALIGNMENT (Paragraph 1):
   - Explicitly cite active/upcoming Dasha planet and years (e.g., "[Planet] Mahadasha starting in [start_year], with active phases in [active_year]").
   - Cite major planetary transits and houses.

3. HOUSE & PLANETARY EVIDENCE (Paragraph 2 & 3):
   - Cite specific house placements, retrograde status, Moon sign, and Ascendant.
   - Explain the personality, life dynamics, and psychological patterns resulting from these placements.

4. CLEAN PROSE PARAGRAPHS (NO HEADERS, NO BULLETS):
   - Write in 3–4 clean, well-spaced prose paragraphs.
   - DO NOT use markdown section headers (###) or bullet lists (- / *).

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical advice.

Target Length: 140–220 words.
"""




def get_overview_prompt(is_initial: bool = True) -> str:
    return OVERVIEW_INITIAL_SYSTEM if is_initial else OVERVIEW_CHAT_SYSTEM



def build_overview_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    meta = chart_data.get("metadata", {})
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])
    doshas = chart_data.get("doshas", {})

    # Include lucky attributes and element data if pre-computed
    lucky = ""
    elements = ""
    rankings = ""
    if computed:
        if computed.get("lucky"):
            l = computed["lucky"]
            lucky = (
                f"\n[LUCKY ATTRIBUTES]\n"
                f"Colors: {', '.join(l.get('lucky_colors', []))}\n"
                f"Numbers: {', '.join(str(n) for n in l.get('lucky_numbers', []))}\n"
                f"Day: {l.get('lucky_day', 'N/A')}\n"
                f"Direction: {l.get('lucky_direction', 'N/A')}"
            )
        if computed.get("elements"):
            e = computed["elements"]
            elements = (
                f"\n[ELEMENT DISTRIBUTION]\n"
                f"Fire: {e.get('Fire', 0)}% | Earth: {e.get('Earth', 0)}% | "
                f"Air: {e.get('Air', 0)}% | Water: {e.get('Water', 0)}% | "
                f"Dominant: {e.get('dominant', 'N/A')}"
            )
        if computed.get("planet_rankings"):
            top3 = computed["planet_rankings"][:3]
            bot2 = computed["planet_rankings"][-2:]
            rankings = "\n[PLANET STRENGTH RANKING]\nStrongest: " + ", ".join(
                f"{r['planet'].capitalize()} ({r['status']})" for r in top3
            ) + "\nWeakest: " + ", ".join(
                f"{r['planet'].capitalize()} ({r['status']})" for r in bot2
            )

    hist_text = format_history(history)
    hist_block = f"[CONVERSATION HISTORY]\n{hist_text}\n\n" if hist_text else ""

    return f"""{hist_block}[USER PROFILE]
{format_profile(profile)}

[CORE CHART]
{format_core_chart(chart_data)}
{rankings}

[PLANETARY POSITIONS]
{format_planets(planets)}

[KEY HOUSES]
{format_houses_subset(houses, planets, [1, 4, 5, 7, 9, 10])}

[YOGAS & DOSHAS]
{format_yogas(yogas)}
{format_doshas(doshas)}

[USER QUESTION]
"{query}" """
