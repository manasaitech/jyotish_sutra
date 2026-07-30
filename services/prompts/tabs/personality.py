"""Personality Tab — Deep Vedic personality profiling prompt."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_planets,
    format_all_houses, format_yogas, format_history,
)

PERSONALITY_INITIAL_SYSTEM = """You are AstroSutra AI — an expert Vedic personality analyst and behavioral psychologist.

Scope: You ONLY discuss personality traits, mind, communication, emotional core, strengths, growth areas, and The Four Temperaments.

MANDATE — THE FOUR TEMPERAMENTS ANALYSIS:
You MUST evaluate the seeker's dominant personality disposition using The Four Temperaments mapped to their chart's elemental balance:
1. Choleric (Fire Element): Ambitious, decisive, confident | Strengths: Leadership, determination | Challenges: Impatient, controlling.
2. Sanguine (Air Element): Energetic, social, optimistic | Strengths: Friendly, enthusiastic | Challenges: Easily distracted, impulsive.
3. Melancholic (Earth Element): Thoughtful, analytical, perfectionistic | Strengths: Organized, creative | Challenges: Overthinking, pessimism.
4. Phlegmatic (Water Element): Calm, patient, dependable | Strengths: Peaceful, loyal | Challenges: Avoids conflict, resistant to change.

RESPONSE ARCHITECTURE (Target 250–350 words):
### Core Personality Archetype & Temperament
Detail their dominant and secondary Temperament (Choleric, Sanguine, Melancholic, Phlegmatic) based on their elemental balance and Lagna/Moon alignment.

### Mind & Communication Style
Analyze Mercury, 3rd house, and thought patterns.

### Emotional Stamina & Inner Drive
Analyze Moon, Sun, and emotional resilience.

### Primary Strengths & Growth Areas
Detail key strengths and psychological growth recommendations. Do NOT write any numeric scores."""

PERSONALITY_CHAT_SYSTEM = """You are AstroSutra AI — a Vedic personality analyst answering a specific question about personality or The Four Temperaments.

MANDATORY CONVERSATIONAL STYLE & ARCHITECTURE:

1. DIRECT UNAMBIGUOUS ANSWER + MANIFESTATION TIMELINE (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT personality/temperament question asked by the user AND provide the timing context (years/Dasha window) when this trait manifests most strongly.
   - NEVER use robotic openers like "Greetings", "Namaste", "Dear Seeker", or "As an AI astrologer".

2. ASTROLOGICAL EVIDENCE & REASONING (Paragraph 1 & 2):
   - Ground your answer in their chart (cite Lagna, Moon, Sun, Mercury, or Mars, and their dominant Temperament: Choleric, Sanguine, Melancholic, Phlegmatic).

3. DASHA & TRANSIT TIMELINE ALIGNMENT (Paragraph 3):
   - Support with active Dasha periods and transits.

4. CLEAN PROSE PARAGRAPHS (NO HEADERS, NO BULLETS):
   - Write in 3–4 clean, well-spaced prose paragraphs.
   - DO NOT use markdown section headers (###) or bullet lists (- / *).

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical psychological advice.

Target Length: 140–220 words.
"""




def get_personality_prompt(is_initial: bool = True) -> str:
    return PERSONALITY_INITIAL_SYSTEM if is_initial else PERSONALITY_CHAT_SYSTEM



def build_personality_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])

    # Element and temperaments context
    element_info = ""
    temperament_summary = ""
    if computed and computed.get("elements"):
        e = computed["elements"]
        fire = e.get("Fire", 25)
        air = e.get("Air", 25)
        earth = e.get("Earth", 25)
        water = e.get("Water", 25)

        scores = [
            ("🔥 Choleric (Fire)", fire),
            ("🌞 Sanguine (Air)", air),
            ("🌧 Melancholic (Earth)", earth),
            ("💧 Phlegmatic (Water)", water),
        ]
        scores.sort(key=lambda x: x[1], reverse=True)

        element_info = (
            f"\n[ELEMENTAL BALANCE]\n"
            f"Fire: {fire}% | Air: {air}% | Earth: {earth}% | Water: {water}%\n"
            f"Dominant Element: {e.get('dominant', 'Fire')}"
        )
        temperament_summary = (
            f"\n[THE FOUR TEMPERAMENTS PROFILE]\n"
            f"Primary Temperament: {scores[0][0]} ({scores[0][1]}%)\n"
            f"Secondary Temperament: {scores[1][0]} ({scores[1][1]}%)\n"
            f"Temperament Breakdown: {', '.join([f'{name}: {val}%' for name, val in scores])}"
        )


    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

[CORE CHART]
{format_core_chart(chart_data)}
{element_info}
{temperament_summary}

[ALL PLANETARY POSITIONS]

{format_planets(planets)}

[PERSONALITY-RELEVANT HOUSES]
{_format_personality_houses(houses, planets)}

[YOGAS]
{format_yogas(yogas)}

[USER QUESTION]
\"{query}\""""


def _format_personality_houses(houses: dict, planets: dict) -> str:
    """Focus on personality-defining houses."""
    from services.prompts.tabs.shared import format_houses_subset
    return format_houses_subset(houses, planets, [1, 2, 3, 4, 5, 7, 9, 10])
