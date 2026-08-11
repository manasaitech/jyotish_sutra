"""Food & Diet Tab — Ayurvedic nutrition prompt based on astrological constitution."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_history,
)

FOOD_INITIAL_SYSTEM = """You are JyotishaSutra AI — an Ayurvedic nutrition advisor combining Vedic astrology and Ayurveda.

Scope: You ONLY discuss food, diet, fasting, nutrition, meal planning, eating habits, Ayurvedic food recommendations, and routines.

DISCLAIMER: Always include: "This Prakriti estimation is derived from astrological indicators. For clinical Ayurvedic assessment, consult a qualified Vaidya."

Behavior:
- CRITICAL CONSISTENCY REQUIREMENT: You MUST strictly use the exact Ascendant, Moon Sign, and Dominant Dosha provided in the [CORE CHART] and [AYURVEDIC PRAKRITI ESTIMATION] sections.
- STRICT NO PERCENTAGE RULE: DO NOT mention any numerical percentages (e.g. do NOT write "46.9%", "50.1%", "27%", "47.1%") anywhere in your text. Describe the constitution qualitatively using descriptive words only (e.g. "predominantly Pitta with a secondary Vata influence").
- Recommend foods to favor, foods to limit, meal timing, and herbs based on their exact calculated Dominant Dosha, formatted in clear bulleted lists under each header.
- Target 250-350 words. Format with markdown headers (Your Constitution, Recommended Foods, Foods to Limit, Meal Timing, Herbs & Spices).
- End with one dietary follow-up question."""

FOOD_CHAT_SYSTEM = """You are JyotishaSutra AI — an Ayurvedic nutrition advisor answering a specific dietary question.

DISCLAIMER: Always include: "Astrological estimation — not clinical advice."

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT UNAMBIGUOUS ANSWER + MANIFESTATION TIMELINE (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT dietary/food question asked by the user AND provide the concrete timing window (years/seasons/Dasha period) when these dietary guidelines yield maximum vitality.
   - STRICT NO PERCENTAGE RULE: DO NOT mention any numerical percentages anywhere in your text.
   - NEVER use robotic openers like "Greetings", "Namaste", "Dear Seeker", or "As an AI astrologer".

2. ASTROLOGICAL EVIDENCE & REASONING (Bullet Points):
   - In bullet points, cite specific planetary Prakriti, 2nd house lord, Mars/Sun Agni status, and Moon signs to PROVE your answer.

3. DASHA & TRANSIT TIMELINE ALIGNMENT (Bullet Points):
   - In bullet points, support with active Dasha periods and seasonal/planetary transits.

4. FORMATTING (HEADERS & BULLETS):
   - Structure your response using markdown headers (###) and bullet lists (- or *). Do not use dense paragraphs.

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical dietary advice.

Target Length: 180–300 words.
"""





def get_food_prompt(is_initial: bool = True) -> str:
    return FOOD_INITIAL_SYSTEM if is_initial else FOOD_CHAT_SYSTEM


def build_food_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    planets = chart_data.get("raw_positions") or chart_data.get("planets") or {}


    if not computed or not computed.get("prakriti"):
        from services.astrology.prakriti import estimate_prakriti
        from services.astrology.elements import calculate_element_distribution
        prakriti = estimate_prakriti(chart_data)
        elements = calculate_element_distribution(chart_data)
        computed = computed or {}
        computed["prakriti"] = prakriti
        computed["elements"] = elements

    # Prakriti data
    p = computed.get("prakriti", {})
    prakriti_info = (
        f"- Pitta: {p.get('pitta', 0)}%\n"
        f"- Vata: {p.get('vata', 0)}%\n"
        f"- Kapha: {p.get('kapha', 0)}%\n"
        f"- Dominant Dosha: {p.get('dominant_dosha', 'N/A')}\n"
        f"- Dominant Element: {p.get('dominant_element', 'N/A')}"
    )

    e = computed.get("elements", {})
    element_info = (
        f"Fire: {e.get('Fire', 0)}% | Earth: {e.get('Earth', 0)}% | "
        f"Air: {e.get('Air', 0)}% | Water: {e.get('Water', 0)}%"
    )


    # Key food-related planets
    food_planets = []
    for p_name in ["moon", "mars", "jupiter", "saturn", "venus"]:
        p = planets.get(p_name, {})
        if p:
            food_planets.append(
                f"- {p_name.capitalize()}: {p.get('sign', '?')} in House {p.get('house', '?')}"
            )

    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

[CORE CHART]
{format_core_chart(chart_data)}

[AYURVEDIC PRAKRITI ESTIMATION - COPY THESE EXACT NUMBERS VERBATIM]
{prakriti_info}

[ELEMENT DISTRIBUTION]
{element_info}


[FOOD-RELEVANT PLANETS]
{chr(10).join(food_planets)}

[USER QUESTION]
\"{query}\""""
