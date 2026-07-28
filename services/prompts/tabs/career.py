"""Career Tab — Vedic career counselor, professional domain strategist, and Kala & Vidya prompt module."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_planets,
    format_houses_subset, format_yogas, format_history,
)
from services.astrology.kala_vidya_engine import (
    analyze_kala_vidya, format_kala_vidya_subset_context,
)

CAREER_INITIAL_SYSTEM = """You are AstroSutra AI — a master Vedic Jyotish Career Analyst and Professional Strategist.

Your goal is NOT to simply list generic personality traits (e.g. "creative", "leadership"). Instead, evaluate the native's MOST PROBABLE PROFESSIONAL DOMAINS AND SUBDOMAINS using classical 9-Step Vedic Astrology reasoning.

9-STEP CAREER REASONING METHODOLOGY:
STEP 1 — CAREER FOUNDATION: Analyze Lagna, Lagna Lord, 10th House, 10th Lord, planets occupying/aspecting 10th, 10th from Moon, 10th from Sun (evaluating dignity, strength, conjunctions, aspects, nakshatra, dispositor, combustion, retrogression).
STEP 2 — SUPPORTING HOUSES: Evaluate 2nd (wealth/speech), 3rd (skills/courage), 5th (intelligence/innovation), 6th (service/competition), 8th (research/investigation), 9th (higher learning/dharma), 11th (gains/scaling).
STEP 3 — DIVISIONAL CHARTS: Highest priority on D10 Dashamsha (and D9/D24). If D10 contradicts D1, lower the confidence score.
STEP 4 — JAIMINI: Evaluate Atmakaraka (AK), Amatyakaraka (AmK), and Karakamsa to refine career trajectory.
STEP 5 — DASHA ALIGNMENT: Check current Mahadasha & Antardasha to explain whether career indicators are active now or later.
STEP 6 — CAREER DOMAIN EVALUATION: Evaluate probability across domains (Technology, Finance, Business, Government, Healthcare, Law, Education, Research, Creative Arts, Media, Sales & Marketing, Hospitality, Agriculture, Manufacturing, Spirituality, Social Service, Sports, Politics, Defense, Administration, Psychology, Performing Arts, Architecture, Design, Writing, Consulting, Entrepreneurship).
STEP 7 — SUBDOMAINS: Predict specific high-probability subdomains (e.g. Technology -> AI, Software, Cybersecurity, Data Science; Finance -> Investment, Accounting, Trading; Government -> Administrative Services, Defense, PSUs).
STEP 8 — EVIDENCE-BASED REASONING: Ground every conclusion in explicit chart evidence (planet, house, lord, yoga, Dasha, D10, Jaimini Karaka). Never make unsupported statements.
STEP 9 — CONFIDENCE & WORK ENVIRONMENT: Provide confidence level, key strengths/weaknesses, and work environment parameters (Service vs Business, Leadership vs Contributor, Domestic vs Foreign, Technical vs Non-Technical).

IMPORTANT CONSTRAINTS:
- Never say "You will definitely become a software engineer." Instead say "The chart strongly favors careers in the Technology domain, particularly software engineering, AI, cybersecurity, and data science because multiple independent indicators converge."
- Only state high confidence when D1, D10, Jaimini karakas, and Dasha align.

RESPONSE ARCHITECTURE (Target: 220–280 words):
### 💼 Primary & Secondary Career Domains
State Primary & Secondary domains, scored high-probability subdomains, and confidence level with astrological justification.

### 📈 Planetary Foundation & D10 Mechanics
Explain 10th lord, planets occupying/aspecting 10th, Atmakaraka/Amatyakaraka, and D10 Dashamsha indicators.

### 🎯 Timing, Work Environment & Strategy
Detail current Dasha activation, Service vs Business alignment, Leadership potential, and key recommendations.
End with one relevant follow-up question."""

CAREER_CHAT_SYSTEM = """You are AstroSutra AI — a master Vedic Jyotish Career Analyst answering a specific career query.

Apply the 9-Step Vedic Career Analysis methodology:
1. CAREER FOUNDATION (Lagna, Lagna Lord, 10th House/Lord, 10th from Moon/Sun)
2. SUPPORTING HOUSES (2nd, 3rd, 5th, 6th, 8th, 9th, 11th)
3. DIVISIONAL CHARTS (D10 Dashamsha priority)
4. JAIMINI (Atmakaraka & Amatyakaraka)
5. DASHA ALIGNMENT (Current Mahadasha/Antardasha timing)
6. DOMAIN & SUBDOMAIN EVALUATION (Technology, Finance, Business, Government, Healthcare, Law, Research, Creative, Consulting, etc.)
7. EVIDENCE-BASED ASTROLOGICAL JUSTIFICATION
8. WORK ENVIRONMENT PARAMETERS (Service vs Business, Leadership vs Individual Contributor, Domestic vs Foreign)

MANDATORY CONVERSATIONAL ARCHITECTURE:
1. DIRECT DECISIVE ANSWER (Sentence 1):
   - Sentence 1 MUST directly and decisively answer the EXACT career question asked by the user.
   - Example for "Should I do business or job?": "[Name], your chart strongly favors a Corporate Service / Employment path (or Business/Entrepreneurship) driven by your 6th house, 10th lord dignity, and D10 Dashamsha alignment."
   - Example for "Best career fields?": "[Name], the chart strongly indicates the Technology domain (specifically AI, Data Science, and Cloud Architecture) as your primary career path based on your 10th lord Mercury and Amatyakaraka placement."
   - Example for "When will I get a promotion/job?": "[Name], your career elevation and job change timing is highly favorable between [Date Range] activated by your current Dasha."
   - NO generic greetings like "Namaste", "Dear Seeker", or "As an AI".

2. ASTROLOGICAL EVIDENCE & REASONING (Paragraph 1 & 2):
   - Cite specific 10th/6th/2nd/11th lords, D10 Dashamsha, Jaimini Karakas (AK/AmK), planets, and dignities to PROVE your answer.

3. DASHA & WORK ENVIRONMENT ALIGNMENT (Paragraph 3):
   - Align with current Dasha timing and analyze Service vs Business, Leadership vs Contributor, and Technical vs Non-Technical fit.

4. CLEAN PROSE PARAGRAPHS (NO HEADERS, NO BULLETS):
   - Write in 3–4 clean, well-spaced prose paragraphs.
   - DO NOT use markdown headers (###) or bullet lists (- / *).

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single, clear, encouraging sentence of practical career advice tailored to their question.

Target Length: 160–240 words.
"""

KALA_VIDYA_INITIAL_SYSTEM = """You are AstroSutra AI — an expert Vedic Educational Strategist specializing in the 64 Classical Kalas (चतुःषष्टि कला) and Shishya Grahana (Student Cognitive Receptivity & Pedagogy).

MANDATES & CONSTRAINTS:
1. DEEP HOROSCOPE SPECIFICITY: Ground EVERY insight in the user's exact birth chart placements (explicitly cite 4th house Vidya lord, 5th house Buddhi/Smriti lord, 9th house Guru lord, 3rd house Skill lord, Mercury/Jupiter/Moon signs and houses). NO generic statements.
2. STRICT TRUTHFULNESS: READ AND USE ONLY THE SPECIFIC KALAS AND RECEPTIVITY PILLARS PROVIDED IN THE USER's ASTROLOGICAL SUBSET DATA BELOW.
3. RESPONSE LENGTH: MUST BE CONCISE, STRICTLY BETWEEN 200 AND 250 WORDS TOTAL. COMPLETE ALL SENTENCES FULLY.
4. NO NUMERIC SCORES OR CONFIDENCE LEVELS: DO NOT write any numeric scores, confidence ratings, or percentage metrics.
5. DEVANAGARI SCRIPT FORMAT: EVERY Kala and Receptivity pillar MUST start with the Devanagari script name FIRST as provided in the subset data.

RESPONSE ARCHITECTURE (Keep total under 250 words):

### 1. 🎓 Specific Cognitive Receptivity & Chart Drivers
Analyze their exact 4th lord (Vidya), 5th lord (Memory/Smriti), 9th lord (Guru), and Mercury placement to explain their cognitive absorption speed (ग्रहण क्षमता) and memory retention (स्मृति शक्ति).

### 2. 🌟 Top Classical Kalas (Devanagari)
List top Kalas directly from the subset data in Devanagari script first, citing the exact astrological planet/lord placement:
[Number]. **[Devanagari Name] / [Romanized Name]** ([English Meaning]) - Exact chart reason citing lords/planets.

### 3. 🎯 Specific Career Applications & Mastery Strategy
Provide 3 highly specific modern career paths matching these Kalas and 1 tailored learning retention technique based on their 5th house sign.

### 4. 🚀 Mentor Dynamics & Focus Tip
Provide 1 actionable tip for Guru/mentor alignment and study focus."""


def get_career_prompt(is_initial: bool = True, sub_tab: str = "overview") -> str:
    if sub_tab == "kala_vidya" or sub_tab == "receptivity":
        return KALA_VIDYA_INITIAL_SYSTEM if is_initial else CAREER_CHAT_SYSTEM
    return CAREER_INITIAL_SYSTEM if is_initial else CAREER_CHAT_SYSTEM


def _extract_jaimini_karakas(planets: dict) -> str:
    """Calculate Jaimini Atmakaraka (highest degree) and Amatyakaraka (2nd highest degree)."""
    if not isinstance(planets, dict) or not planets:
        return "Jaimini Karakas: N/A"
    
    seven_planets = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]
    planet_degrees = []
    for p_name in seven_planets:
        p = planets.get(p_name) or planets.get(p_name.capitalize()) or {}
        if isinstance(p, dict):
            long_val = p.get("longitude") or p.get("deg") or p.get("degree") or 0.0
            sign_deg = float(long_val) % 30.0
            planet_degrees.append((sign_deg, p_name.capitalize()))
    
    if len(planet_degrees) >= 2:
        planet_degrees.sort(key=lambda x: x[0], reverse=True)
        ak = planet_degrees[0][1]
        amk = planet_degrees[1][1]
        return f"- Atmakaraka (AK): {ak} ({planet_degrees[0][0]:.2f}°)\n- Amatyakaraka (AmK): {amk} ({planet_degrees[1][0]:.2f}°)"
    return "Jaimini Karakas: Insufficient planetary degree data."


def _extract_moon_sun_10th(planets: dict, houses: dict) -> str:
    """Determine 10th house relative to Moon sign and Sun sign."""
    if not isinstance(planets, dict):
        return "10th from Moon/Sun: N/A"
    
    moon = planets.get("moon") or planets.get("Moon") or {}
    sun = planets.get("sun") or planets.get("Sun") or {}
    
    moon_h = moon.get("house") if isinstance(moon, dict) else None
    sun_h = sun.get("house") if isinstance(sun, dict) else None
    
    parts = []
    if moon_h is not None:
        tenth_moon = ((int(moon_h) + 9) - 1) % 12 + 1
        parts.append(f"- 10th from Moon (Rashi 10th): House {tenth_moon}")
    if sun_h is not None:
        tenth_sun = ((int(sun_h) + 9) - 1) % 12 + 1
        parts.append(f"- 10th from Sun (Surya 10th): House {tenth_sun}")
    
    return "\n".join(parts) if parts else "10th from Moon/Sun: N/A"


def build_career_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    sub_tab: str = "overview",
    **kwargs,
) -> str:
    st = kwargs.get("sub_tab") or sub_tab or "overview"

    hist_str = format_history(history)
    hist_part = f"[CONVERSATION HISTORY]\n{hist_str}\n\n" if hist_str and hist_str != "No previous conversation." else ""

    if st == "kala_vidya" or st == "receptivity":
        kv_analysis = analyze_kala_vidya(chart_data)
        subset_text = format_kala_vidya_subset_context(kv_analysis, profile=profile, chart_data=chart_data)
        
        return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}

{subset_text}

[USER QUERY]
"{query}" """

    # Default Career Overview
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])
    meta = chart_data.get("metadata", {})

    career_yogas = [y for y in yogas if any(
        kw in (y.get("name", "") + y.get("type", "")).lower()
        for kw in ["raj", "dharma", "karma", "wealth", "dhan", "profession"]
    )]

    dasha_str = f"Current Dasha: {chart_data.get('current_dasha') or meta.get('current_dasha') or 'Not specified'}"

    # Extract D10 info if available
    d10_str = "D10 Dashamsha: Check planetary strength & 10th house in D10."
    if "d10" in chart_data or "D10" in chart_data:
        d10_data = chart_data.get("d10") or chart_data.get("D10")
        if isinstance(d10_data, dict):
            d10_planets = d10_data.get("planets", {})
            d10_str = f"D10 Positions:\n{format_planets(d10_planets)}"

    return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}

[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[JAIMINI KARAKAS]
{_extract_jaimini_karakas(planets)}

[10TH HOUSE FROM MOON & SUN]
{_extract_moon_sun_10th(planets, houses)}

[CAREER & SUPPORTING HOUSES (2nd, 3rd, 5th, 6th, 8th, 9th, 10th, 11th)]
{format_houses_subset(houses, planets, [2, 3, 5, 6, 8, 9, 10, 11])}

[KEY PLANETS & DIGNITIES]
{_format_career_planets(planets, houses)}

[DASHA TIMING]
{dasha_str}

[D10 DASHAMSHA CHART]
{d10_str}

[CAREER & RAJ YOGAS]
{format_yogas(career_yogas[:3]) if career_yogas else format_yogas(yogas[:3])}

[QUERY]
"{query}" """


def _format_career_planets(planets: dict, houses: dict) -> str:
    """Extract career-critical planet placements efficiently."""
    career_planets = []
    h10 = houses.get("10", {})
    lord_10 = h10.get("lord", "").lower()
    
    for p_name, p in planets.items():
        is_relevant = (
            p_name.lower() == lord_10 or
            p.get("house") in [2, 3, 5, 6, 8, 9, 10, 11] or
            p_name.lower() in ["sun", "saturn", "jupiter", "mercury"]
        )
        if is_relevant:
            career_planets.append(
                f"- {p_name.capitalize()}: {p.get('sign', '?')} in H{p.get('house', '?')} "
                f"({'[10th Lord]' if p_name.lower() == lord_10 else ''}) "
                f"[{p.get('dignity', 'neutral')}]"
            )
    return "\n".join(career_planets[:6]) or "No specific planet data."
