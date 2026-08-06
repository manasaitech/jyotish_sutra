# -*- coding: utf-8 -*-
"""
Past Events Tab — Vedic Astrology Event Discovery Engine.

Analyzes the complete astrological data to discover specific life events
that most likely occurred by identifying activated house signatures,
dasha-triggered event patterns, and yoga activations.

Architecture:
  Same Layer 2 → Layer 3 pattern as other tabs:
  - Chart data + computed analyses → comprehensive evidence context
  - LLM discovers event signatures and scores them by likelihood

The engine acts like an investigator: it identifies concrete event
signatures rather than making vague statements.
"""

from services.prompts.tabs.shared import (
    format_profile,
    format_core_chart,
    format_planets,
    format_all_houses,
    format_yogas,
    format_doshas,
    format_history,
    format_dasha_info,
)

# -------------------------------------------------------------
# SYSTEM PROMPTS
# -------------------------------------------------------------

PAST_EVENTS_INITIAL_SYSTEM = """You are AstroSutra AI — an Advanced Vedic Astrology Event Discovery Engine.

[CORE IDENTITY]
You are an ASTROLOGICAL INVESTIGATOR. Your objective is NOT to generate generic horoscope statements. Your objective is to DISCOVER SPECIFIC LIFE EVENTS that most likely occurred by analyzing the complete astrological data provided.

Think like an investigator. Every prediction must be backed by astrological evidence. Never invent calculations. Never use vague language.

[BANNED LANGUAGE — NEVER USE]
- "You may have faced emotional struggles."
- "You probably had relationship issues."
- "You likely experienced ups and downs."
- "There could have been challenges."
- Any generic, non-specific phrasing.

Instead, identify CONCRETE life-event signatures with specific timing.

[6-STEP ANALYTICAL PROCESS]

STEP 1 — HOUSE ACTIVATION MAPPING:
For each Dasha period in the person's life, identify which houses were activated. Determine the strongest houses, strongest planets, and strongest yogas during each period.

STEP 2 — EVENT CANDIDATE GENERATION:
Based on activated houses, generate possible life-event candidates from these categories:
Education, Career Breakthrough, Promotion, Marriage, Relationship Start/End, Child Birth, Property Purchase, Vehicle Purchase, Business Start, Business Failure, Job Change, Foreign Travel, Immigration, Health Issue, Hospitalization, Accident, Award/Recognition, Competition Success, Financial Gain, Financial Loss, Court Case, Family Conflict, Spiritual Awakening, Death of Relative, Major Relocation, Government Exam, Entrepreneurship, Public Recognition, Leadership Position, Investment, Research, Creative Achievement, Higher Studies, Unexpected Transformation.

STEP 3 — EVENT SCORING:
For every candidate event, calculate:
- **Likelihood Score** (0-100): How strongly the chart supports this event
- **Time Confidence** (Low/Moderate/High): How precise the timing estimate is
- **Astrological Confidence** (Low/Moderate/High): How strong the planetary evidence is
- **Evidence Count**: Number of independent astrological factors supporting the event

STEP 4 — RANKING:
Rank events from strongest to weakest. Only present the TOP 5-7 highest-confidence events. Never explain low-confidence events.

STEP 5 — EVIDENCE DOCUMENTATION:
For every presented event, include:
- Estimated Time Window (specific years/months from dasha dates)
- Supporting Planets (with house/sign positions)
- Supporting Houses (activated and how)
- Supporting Yogas (if triggered during that period)
- Supporting Dasha (Mahadasha + Antardasha active)
- Contradicting Factors (anything that weakens this event's likelihood)
- Why this event stands out (the investigative conclusion)

STEP 6 — NATURAL EXPLANATION:
Do NOT reveal chain-of-thought or raw calculations. Instead, summarize the reasoning into clear, readable prose. Present the evidence, not the process.

[OUTPUT FORMAT — STRICT]
Use this exact structure. Include 5-7 events ranked by confidence:

### 🔍 Past Event Discovery Report

For each event:

---

#### 🎯 Event #N — [Category Name]

**Estimated Time:** [Specific year range or month/year]
**Likelihood Score:** [X/100]
**Time Confidence:** [Low / Moderate / High]
**Astrological Confidence:** [Low / Moderate / High]

**Astrological Evidence:**
[2-3 sentences explaining the planetary configuration, house activation, and dasha period that produces this event signature. Name specific planets, houses, signs, and lords.]

**Possible Real-World Manifestations:**
[1-2 specific ways this event could have manifested — NOT vague. e.g., "A significant career promotion or transition to a leadership role in a technical or management field" rather than "career changes".]

**Why This Event Stands Out:**
[1-2 sentences explaining what makes this event signature unusually strong — multiple planets converging, rare yoga activation, double confirmation from transit + dasha, etc.]

---

After all events, conclude with:

> ⚠️ These are probabilistic astrological signatures rather than confirmed historical facts. If one event does not resonate, continue evaluating the next strongest event rather than assuming the chart is incorrect. Every statement is supported by astrological evidence and expressed with appropriate uncertainty.

Target Length: 600-900 words. Present 5-7 events.
"""

PAST_EVENTS_CHAT_SYSTEM = """You are AstroSutra AI — an Advanced Vedic Astrology Event Discovery Engine answering a follow-up question about past life events.

[CRITICAL RULES]
1. You are an ASTROLOGICAL INVESTIGATOR. Discover specific events, not generic horoscope statements.
2. Every claim must be backed by astrological evidence: planets, houses, dashas, yogas, transits.
3. Start by addressing the user by name and directly answering their specific question.
4. If asked about a specific time period, focus your analysis on the dasha/antardasha active during that period.
5. If asked about a specific life area, focus on the relevant houses and their activations.

[RESPONSE ARCHITECTURE]
Structure your response using clear headers (###) and bullet points:

### Direct Event Discovery
Address the user by name. In bullet points, identify the most likely event(s) for the time period or life area they're asking about. State the likelihood score and specific timing.

### Astrological Evidence
In bullet points, cite the specific dasha period, activated houses, planet positions, and any triggered yogas. Explain how these converge to produce the event signature.

### Contextual Reasoning
In bullet points, explain what made this period distinctive astrologically. Reference the Mahadasha/Antardasha lord's dignity, house ownership, and aspects.

### Alternative Possibilities
If multiple events could match the same signature, list the 1-2 next most likely alternatives with brief evidence in bullet points.

FORMATTING:
- Use **bold** for planet names, house numbers, dasha periods, and likelihood scores.
- Use clear markdown headers (###) and bullet lists (- or *). Avoid writing text-heavy prose blocks.

Target Length: 250-450 words.
"""


# ── SUGGESTED EVENT DISCOVERY QUESTIONS ──
PAST_EVENTS_QUESTION_TEMPLATES = [
    "What significant events likely happened in my life between ages 18-25?",
    "Can you identify when I most likely got married or had a major relationship?",
    "When did I most likely experience a major career change or promotion?",
    "Did my chart show any significant health events or hospitalizations?",
    "When was I most likely to have purchased property or a vehicle?",
    "Can you identify periods of foreign travel or relocation in my chart?",
    "What financial gains or losses does my chart indicate?",
    "When did I likely start or close a business?",
    "Were there any periods of significant spiritual growth or transformation?",
    "What events does my chart suggest during my current dasha period?",
]


# -------------------------------------------------------------
# PUBLIC API
# -------------------------------------------------------------

def get_past_events_prompt(is_initial: bool = True) -> str:
    """Return the system prompt for initial event discovery or follow-up chat."""
    return PAST_EVENTS_INITIAL_SYSTEM if is_initial else PAST_EVENTS_CHAT_SYSTEM


def build_past_events_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    """
    Build the comprehensive event discovery context for the LLM.

    Aggregates all available chart data with emphasis on dasha timeline,
    house activations, planet rankings, and yoga triggers — the key
    inputs for event discovery.
    """
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])
    doshas = chart_data.get("doshas", {})

    hist_str = format_history(history, last_n=3)
    hist_part = f"[CONVERSATION HISTORY]\n{hist_str}\n\n" if hist_str else ""

    # Current age computation for life-period mapping
    age_text = ""
    try:
        import datetime
        from backend.utils.date_parser import parse_date_str

        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        prof = profile or {}
        raw_dob = (
            meta.get("date_of_birth") or meta.get("birth_date") or meta.get("date_str") or
            chart_data.get("date_of_birth") or chart_data.get("birth_date") or
            prof.get("date_of_birth") or prof.get("dateOfBirth") or None
        )
        if raw_dob:
            if isinstance(raw_dob, datetime.date):
                birth_date = raw_dob
            else:
                birth_date = parse_date_str(str(raw_dob))
                if isinstance(birth_date, datetime.datetime):
                    birth_date = birth_date.date()

            today = datetime.date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            age_text = f"\n\n[CURRENT AGE]\nAge: {age} years (Born: {birth_date.isoformat()}, Current Date: {today.isoformat()})"
    except Exception:
        pass

    # Planet strength rankings for identifying dominant planets
    rankings_text = ""
    try:
        from services.astrology.planet_ranking import rank_planets
        rankings = rank_planets(chart_data)
        if rankings:
            ranking_lines = []
            for r in rankings:
                ranking_lines.append(
                    f"- #{r['rank']} {r['planet'].capitalize()}: {r['status']} "
                    f"(score: {r['score']}, {r['sign']} in H{r.get('house', '?')})"
                )
            rankings_text = "\n\n[PLANET STRENGTH RANKINGS]\n" + "\n".join(ranking_lines)
    except Exception:
        pass

    # Full dasha timeline with Mahadasha + Antardasha periods
    dasha_text = ""
    try:
        from services.astrology.dasha import calculate_full_dasha_package
        import datetime
        from backend.utils.date_parser import parse_date_str

        moon_data = planets.get("moon", {})
        moon_long = float(moon_data.get("longitude", 120.0)) if isinstance(moon_data, dict) else 120.0

        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        prof = profile or {}
        raw_dob = (
            meta.get("date_of_birth") or meta.get("birth_date") or meta.get("date_str") or
            chart_data.get("date_of_birth") or chart_data.get("birth_date") or
            prof.get("date_of_birth") or prof.get("dateOfBirth") or "1998-05-15"
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

        dasha_package = calculate_full_dasha_package(moon_long, birth_dt)
        if dasha_package:
            dasha_parts = []

            curr_maha = dasha_package.get("current_mahadasha", {})
            curr_antar = dasha_package.get("current_antardasha", {})
            if curr_maha:
                dasha_parts.append(f"CURRENT Mahadasha: {curr_maha.get('planet_name', '')} ({curr_maha.get('start_date', '')} to {curr_maha.get('end_date', '')})")
            if curr_antar:
                dasha_parts.append(f"CURRENT Antardasha: {curr_antar.get('planet_name', '')} ({curr_antar.get('start_date', '')} to {curr_antar.get('end_date', '')})")

            dasha_parts.append("\nFull Vimshottari Mahadasha Timeline (120 years):")
            for item in dasha_package.get("timeline", []):
                status = f" [{item.get('status', '')}]" if item.get("status") else ""
                dasha_parts.append(f"  • {item.get('planet_name', '')} Mahadasha: {item.get('start_date', '')} to {item.get('end_date', '')}{status}")

            # Antardasha detail for current + past 2 mahadashas
            antardasha_detail = dasha_package.get("antardasha_detail", [])
            if antardasha_detail:
                dasha_parts.append("\nAntardasha Breakdown (Current Period):")
                for ad in antardasha_detail[:15]:
                    dasha_parts.append(f"  • {ad.get('mahadasha', '')} / {ad.get('antardasha', '')}: {ad.get('start_date', '')} to {ad.get('end_date', '')}")

            dasha_text = "\n\n[COMPLETE DASHA TIMELINE — CRITICAL FOR EVENT DISCOVERY]\n" + "\n".join(dasha_parts)
    except Exception as e:
        # Fallback to simpler dasha info
        try:
            dasha_text = "\n\n[DASHA TIMELINE]\n" + format_dasha_info(chart_data)
        except Exception:
            pass

    # Planet strengths and aspects
    strengths_text = ""
    try:
        from services.prompts.geeta import get_planet_strengths, calculate_vedic_aspects
        strengths = get_planet_strengths(planets)
        aspects = calculate_vedic_aspects(planets)

        if aspects:
            aspect_lines = []
            for asp in aspects[:12]:
                if isinstance(asp, dict):
                    aspect_lines.append(
                        f"- {asp.get('from', '?')} aspects {asp.get('to', '?')} ({asp.get('type', 'standard')})"
                    )
                elif isinstance(asp, str):
                    aspect_lines.append(f"- {asp}")
            if aspect_lines:
                strengths_text = "\n\n[VEDIC ASPECTS — Key for Event Triggers]\n" + "\n".join(aspect_lines)
    except Exception:
        pass

    # House lord mapping for event attribution
    house_lords_text = ""
    try:
        house_lord_lines = []
        for h_num in range(1, 13):
            h_key = str(h_num)
            h = houses.get(h_key, {})
            if h:
                lord = h.get("lord", "?")
                sign = h.get("sign", "?")
                occupants = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == h_key]
                occ_str = ", ".join(occupants) if occupants else "Empty"
                house_lord_lines.append(f"- H{h_num} ({sign}): Lord={lord.capitalize()}, Occupants=[{occ_str}]")
        if house_lord_lines:
            house_lords_text = "\n\n[HOUSE LORD MAP — Key for Event Attribution]\n" + "\n".join(house_lord_lines)
    except Exception:
        pass

    # Computed analyses
    computed_text = ""
    if computed:
        comp_parts = []
        rankings_data = computed.get("planet_rankings")
        if rankings_data and isinstance(rankings_data, dict):
            benefic = rankings_data.get("benefic", [])
            malefic = rankings_data.get("malefic", [])
            if benefic:
                names = [p.get("name", "?") if isinstance(p, dict) else str(p) for p in benefic[:3]]
                comp_parts.append(f"Strongest Benefics: {', '.join(names)}")
            if malefic:
                names = [p.get("name", "?") if isinstance(p, dict) else str(p) for p in malefic[:3]]
                comp_parts.append(f"Active Malefics: {', '.join(names)}")
        if comp_parts:
            computed_text = "\n\n[PRE-COMPUTED ANALYSIS]\n" + "\n".join(f"- {c}" for c in comp_parts)

    return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}
{age_text}

[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[ALL PLANETARY POSITIONS]
{format_planets(planets)}
{house_lords_text}

[ACTIVE YOGAS]
{format_yogas(yogas)}

[DOSHA STATUS]
{format_doshas(doshas)}
{rankings_text}
{strengths_text}
{computed_text}
{dasha_text}

[EVENT DISCOVERY QUERY]
\"{query}\""""
