"""Remedies Tab — Personalized Vedic remedies prompt."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_doshas, format_history, format_dasha_info,
)

REMEDIES_INITIAL_SYSTEM = """You are AstroSutra AI — an expert Vedic remedy specialist and Jyotish spiritual advisor.

Scope: You ONLY discuss personalized Vedic remedies: specific mantras, gemstones, charity, fasting, color therapy, deity worship, and daily spiritual practices.

MANDATES & CONSTRAINTS:
1. DASHA TIMELINE BOLD MANDATE: Under the Remedies section, you MUST explicitly state the seeker's active Major Mahadasha planet name along with its exact timeline from starting year to terminating year in **BOLD LETTERS** (using the exact Active Mahadasha Planet provided in the chart context). Explain how these remedies empower this specific timeframe.
2. SPECIFIC PLANETARY MANTRAS: You MUST prescribe the EXACT, authentic Beej & Gayatri mantras for their active Mahadasha planet and any weak planets. NEVER default or substitute Saturn's mantra ("Om Shram Shreem Shraum") for other planets!
3. GEMSTONE CAUTION: Always include a clear Jyotish caveat before prescribing gemstones.
4. FORMAT: Use clear markdown subheaders (###) and bullet lists (- or *) under each category to present remedies so they are easy to read and act upon.

RESPONSE ARCHITECTURE (Target 250–350 words):
### Active Major Mahadasha Remedies
Identify the active Mahadasha planet from the chart context, state its timeline from starting year to terminating year in **BOLD LETTERS**, explain its energetic influence, and provide its specific Beej Mantra, Jaap count, and deity worship in bullet points.

### Specific Planetary Mantras & Daily Practices
List the exact Beej Mantra and daily practice for the active Dasha planet and any afflicted planets in clear bullet points.

### Gemstones & Color Therapy
Detail recommended gemstones (with metal, finger, and day) along with strict Jyotish consultation caveats in a bulleted list.

### Charity (Daana) & Fasting (Vrata)
Specify exact items to donate, recipient, and fasting day as bullet points.

### Dosha Remedies
Specific remedies for active Doshas (Manglik, Kaal Sarp, Sade Sati) formatted in a bulleted list."""

REMEDIES_CHAT_SYSTEM = """You are AstroSutra AI — a Vedic remedy specialist answering a specific remedy question.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT UNAMBIGUOUS ANSWER + MANIFESTATION TIMELINE (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT remedy question asked by the user AND provide the concrete timing window (years/Dasha dates) for performing and benefiting from the remedy.
   - State the active Mahadasha starting year to terminating year in **BOLD LETTERS** when discussing timing.
   - Prescribe the specific, authentic Beej Mantra for the relevant planet. NEVER default to Saturn's mantra unless discussing Saturn.
   - Include gemstone caution ("Consult a Jyotish expert before wearing gemstones") if gemstones are mentioned.
   - NEVER use robotic openers like "Greetings", "Namaste", or "Dear Seeker".

2. ASTROLOGICAL EVIDENCE & REASONING (Bullet Points):
   - In bullet points, cite specific house lords, afflicted planets, Rahu/Saturn status, and Moon sign to PROVE your answer.

3. DASHA & TRANSIT TIMELINE ALIGNMENT (Bullet Points):
   - Support with active Dasha periods (**Active Mahadasha (start to end)**) and transits using bullet points.

4. FORMATTING (HEADERS & BULLETS):
   - Structure your response using markdown headers (###) and bullet lists (- or *). Avoid text-heavy paragraphs.

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical remedy advice.

Target Length: 180–300 words.
"""


def get_remedies_prompt(is_initial: bool = True) -> str:
    return REMEDIES_INITIAL_SYSTEM if is_initial else REMEDIES_CHAT_SYSTEM


def build_remedies_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    doshas = chart_data.get("doshas", {})

    # Remedy data from pre-computation
    remedy_info = "Not pre-computed. Identify weak planets from the planetary positions below."
    if computed and computed.get("remedy_data"):
        rd = computed["remedy_data"]
        weak = rd.get("weak_planets", [])
        if weak:
            lines = []
            for w in weak:
                p = w["planet"]
                r = w.get("remedies", {})
                mantra = r.get("mantra", {})
                gem = r.get("gemstone", {})
                charity = r.get("charity", {})
                deity = r.get("deity", {})
                lines.append(
                    f"\n--- {p.capitalize()} ({w['status']}) ---\n"
                    f"Beej Mantra: {mantra.get('beej', 'N/A')}\n"
                    f"Jaap Count: {mantra.get('count', 'N/A')}\n"
                    f"Gemstone: {gem.get('primary', 'N/A')} (Alt: {gem.get('alternative', 'N/A')})\n"
                    f"Metal: {gem.get('metal', 'N/A')} | Finger: {gem.get('finger', 'N/A')}\n"
                    f"Charity: {', '.join(charity.get('items', []))} on {charity.get('day', 'N/A')}\n"
                    f"Fasting: {r.get('fasting_day', 'N/A')}\n"
                    f"Colors: {r.get('colors', 'N/A')}\n"
                    f"Deity: {deity.get('deity', 'N/A')} — {deity.get('practice', 'N/A')}"
                )
            remedy_info = "\n".join(lines)

        general = rd.get("general_remedies", [])
        if general:
            remedy_info += "\n\n--- Dosha-Specific Remedies ---"
            for g in general:
                remedy_info += f"\n{g['dosha']}: {g['remedy']}"

    # Planet rankings for weakness context
    rankings_info = ""
    if computed and computed.get("planet_rankings"):
        rankings = computed["planet_rankings"]
        weak_list = [r for r in rankings if r["status"] in ("Weak", "Very Weak")]
        if weak_list:
            rankings_info = "\n[PLANET WEAKNESS SUMMARY]\n" + "\n".join(
                f"- {r['planet'].capitalize()}: Score {r['score']} ({r['status']}) — {'; '.join(r.get('reasons', []))}"
                for r in weak_list
            )

    # Active Dasha timeline formatting helper
    dasha_timeline_formatted = format_dasha_info(chart_data)

    # Extract Active Major Mahadasha Planet
    active_dasha = (
        chart_data.get("current_dasha", {}).get("planet")
        or chart_data.get("metadata", {}).get("current_dasha")
        or "Jupiter"
    ).capitalize()

    from services.astrology.remedies_calc import _build_remedies
    dasha_remedy = _build_remedies(active_dasha)
    d_mantra = dasha_remedy.get("mantra", {})
    d_gem = dasha_remedy.get("gemstone", {})
    d_charity = dasha_remedy.get("charity", {})
    d_deity = dasha_remedy.get("deity", {})

    dasha_info = (
        f"\n[ACTIVE MAHADASHA & TIMELINE MANDATE]\n"
        f"{dasha_timeline_formatted}\n"
        f"Specific Beej Mantra: {d_mantra.get('beej', 'N/A')}\n"
        f"Vedic Mantra: {d_mantra.get('vedic', 'N/A')}\n"
        f"Mantra Recitation Count: {d_mantra.get('count', 'N/A')} times\n"
        f"Primary Gemstone: {d_gem.get('primary', 'N/A')} (Metal: {d_gem.get('metal', 'N/A')}, Finger: {d_gem.get('finger', 'N/A')})\n"
        f"Charity Items: {', '.join(d_charity.get('items', []))} on {d_charity.get('day', 'N/A')}\n"
        f"Fasting Day: {dasha_remedy.get('fasting_day', 'N/A')}\n"
        f"Color Therapy: {dasha_remedy.get('colors', 'N/A')}\n"
        f"Deity Worship: {d_deity.get('deity', 'N/A')} — {d_deity.get('practice', 'N/A')}"
    )

    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

[CORE CHART]
{format_core_chart(chart_data)}

{dasha_info}

[DOSHAS]
{format_doshas(doshas)}

[PRE-COMPUTED REMEDY DATA FOR AFFLICTED PLANETS]
{remedy_info}
{rankings_info}

[USER QUESTION]
\"{query}\""""
