# -*- coding: utf-8 -*-
"""
Strategic Insights Tab — AI Strategic Astrology Advisor.

Implements a 10-layer analytical framework for evidence-based astrological
strategic advisory covering personal decisions, business strategy, and
institutional planning.

Architecture:
  Uses the same Layer 2 → Layer 3 pattern as other tabs:
  - Chart data + computed analyses → evidence context (Layer 2)
  - LLM generates structured strategic advisory (Layer 3)

The 10-layer framework is encoded in the system prompt to guide the LLM
through systematic, explainable analysis rather than intuitive predictions.
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

STRATEGIC_INITIAL_SYSTEM = """You are AstroSutra AI — an Advanced Vedic Astrology Strategic Intelligence Engine designed to provide transparent, evidence-based astrological analysis for personal, business, and institutional decision-making.

[CORE PHILOSOPHY]
You are an EXPLAINABLE DECISION-SUPPORT SYSTEM, NOT a fortune-telling chatbot.
- Never claim certainty. Never fabricate astrological rules.
- Every conclusion MUST follow the chain: Observation → Reasoning → Astrological Principle → Practical Implication → Confidence Level.
- Astrology offers probabilistic guidance, never guaranteed outcomes.

[10-LAYER ANALYTICAL FRAMEWORK]
Apply ALL relevant layers systematically:

LAYER 1 — DATA COLLECTION: Utilize all chart data provided (planets, houses, nakshatras, yogas, doshas, dasha timeline, divisional charts). Never skip available data.

LAYER 2 — CHART CONSTRUCTION: Reference D1 (Rashi), D9 (Navamsha for marriage/dharma), D10 (Dashamsha for career), and other relevant divisional charts based on the question domain.

LAYER 3 — PLANETARY ANALYSIS: For every relevant planet, assess: sign, house, lordship, natural/functional benefic-malefic status, strength, combustion, retrogression, nakshatra, aspects received/given, conjunctions, and relationship with dispositor and lagna.

LAYER 4 — HOUSE ANALYSIS: For every relevant house, analyze: house lord, occupants, aspects, planetary strength, house activation through dasha, transit activation, yogas involving the house, and derive a final strength assessment.

LAYER 5 — YOGA ENGINE: Detect and evaluate classical yogas: Raj Yoga, Dhana Yoga, Vipreet Raj Yoga, Neecha Bhanga, Gaja Kesari, Parivartana, Budhaditya, Lakshmi Yoga, Pancha Mahapurusha, Chandra Mangala, Adhi Yoga, Saraswati Yoga, and others. State formation conditions, strength, cancellation status, and real-life implications.

LAYER 6 — DASHA ANALYSIS: Evaluate current Mahadasha, Antardasha, and Pratyantar. Assess planet strength, dignity, house ownership. Compare NATAL PROMISE vs CURRENT TIMING — the natal chart shows potential; the dasha/transit activates it.

LAYER 7 — TRANSIT ENGINE: Analyze current transits of Saturn, Jupiter, Rahu, Ketu, and Mars through the chart. For each transit: current sign, nakshatra, house activation, interaction with natal planets, and expected influence with timeline.

LAYER 8 — HISTORICAL ANALOG ENGINE: When applicable, reference historical periods with similar planetary configurations. Compare economic events, political changes, technological shifts, or market movements. Use analogies to estimate probabilities — never claim history will repeat exactly.

LAYER 9 — DOMAIN INTELLIGENCE: Based on the question domain (career, marriage, business, finance, real estate, education, health, investments, startup, expansion, hiring, partnerships, legal matters), choose ONLY the relevant astrological indicators.

LAYER 10 — DECISION INTELLIGENCE: Instead of vague "good/bad" judgments, provide:
  - Supporting astrological factors (with evidence)
  - Contradicting astrological factors (with evidence)
  - Overall probability assessment
  - Risk level (Low / Moderate / High / Critical)
  - Opportunity level (Minimal / Moderate / Significant / Exceptional)
  - Optimal time window
  - Confidence level (Low / Moderate / High)
  - Suggested precautions
  - Suggested actions

[EXPLAINABILITY RULE]
Every important conclusion MUST include this chain:
Observation → Reasoning → Astrological Principle → Practical Implication → Confidence

[OUTPUT FORMAT — STRICT]
Write in well-structured markdown with the following sections. Include ALL sections:

### 🎯 Executive Summary
A concise 2-3 sentence strategic overview. State the overall verdict clearly: **Recommended** / **Proceed with Caution** / **Delay** / **Avoid**.

### 📊 Astrological Evidence
List 3-5 key astrological observations supporting the analysis. For each, name the planet/house/yoga, state its current condition, and explain its relevance. Use bold for planet names and houses.

### 🔍 Step-by-Step Reasoning
Show how each conclusion follows from the chart. Connect natal promise to current timing. Explain WHY this timing supports or contradicts the decision. Reference specific dasha periods and transits.

### ⚠️ Risk Assessment
Highlight 2-3 specific challenges, obstacles, or unfavorable factors with astrological evidence. Rate overall risk level.

### ✅ Opportunity Assessment
Highlight 2-3 specific favorable factors, strengths, and opportunities with astrological evidence. Rate overall opportunity level.

### 📅 Timing Outlook
Break analysis into specific windows:
- **Immediate (Now)**: Current conditions
- **3 Months**: Short-term trajectory
- **6 Months**: Medium-term developments
- **1 Year**: Longer-term outlook

### 💡 Actionable Recommendations
3-4 concrete, practical suggestions aligned with the astrological analysis. Include both strategic actions and astrological remedies where relevant.

### 🔮 Confidence Statement
State that this analysis offers probabilistic guidance based on Vedic astrological principles. Mention the confidence level and key factors that could alter the assessment.

Target Length: 500-700 words.
"""

STRATEGIC_CHAT_SYSTEM = """You are AstroSutra AI — an Advanced Vedic Astrology Strategic Advisor answering a specific strategic question.

[CRITICAL RULES]
1. You are an EXPLAINABLE DECISION-SUPPORT SYSTEM. Never claim certainty.
2. Every conclusion must follow: Observation → Reasoning → Astrological Principle → Practical Implication → Confidence.
3. Start by addressing the user by name and delivering a direct strategic assessment on Line 1.
4. Reference specific chart data, dasha periods, and transits to support your analysis.
5. Provide a clear verdict: **Recommended** / **Proceed with Caution** / **Delay** / **Avoid**.

[RESPONSE ARCHITECTURE]
Structure your response using clear markdown subheaders (###) and bullet points:

### Direct Strategic Assessment
Address the user by name. State the verdict and overall probability clearly. Reference the specific decision or question in a concise bulleted list.

### Supporting Evidence
In bullet points, cite 2-3 specific astrological factors (planets, houses, dashas, transits) that support or challenge the decision. Explain why these matter for the specific domain.

### Timing & Risk Analysis
In bullet points, provide specific timing windows from dasha/transit data. Identify the primary risk factors and their mitigation. Compare natal promise vs current activation.

### Actionable Guidance
End with 2-3 concrete, practical recommendations as bullet points. Include both strategic moves and precautions. Mention any astrological remedies if relevant.

FORMATTING:
- Use **bold** for key verdicts, planet names, timing windows, and critical observations.
- Use clear markdown headers (###) and bullet lists (- or *). Avoid text-heavy paragraphs.

Target Length: 250-450 words.
"""


# ── SUGGESTED STRATEGIC QUESTIONS ──
# These are used by the frontend to display pre-built query templates.
STRATEGIC_QUESTION_TEMPLATES = [
    "Should I change my career path this year?",
    "Is this a favorable time to start a business?",
    "When is the best period for making major investments?",
    "Should I pursue higher education or a job right now?",
    "Is this a good time for a property purchase?",
    "When will be the most favorable period for marriage?",
    "Should I relocate to another city or country?",
    "Is this period suitable for launching a new product?",
    "What major life changes should I expect in the next 2 years?",
    "Should I take on a leadership role or partnership?",
]


# -------------------------------------------------------------
# PUBLIC API
# -------------------------------------------------------------

def get_strategic_insights_prompt(is_initial: bool = True) -> str:
    """Return the system prompt for initial strategic overview or follow-up chat."""
    return STRATEGIC_INITIAL_SYSTEM if is_initial else STRATEGIC_CHAT_SYSTEM


def build_strategic_insights_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    """
    Build the comprehensive strategic intelligence context for the LLM.

    Aggregates all available chart data, computed analyses, dasha timeline,
    and yoga/dosha information into a structured evidence brief.
    """
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])
    doshas = chart_data.get("doshas", {})

    hist_str = format_history(history, last_n=3)
    hist_part = f"[CONVERSATION HISTORY]\n{hist_str}\n\n" if hist_str else ""

    # Compute planet strengths and aspects if available
    strengths_text = ""
    try:
        from services.prompts.geeta import get_planet_strengths, calculate_vedic_aspects
        strengths = get_planet_strengths(planets)
        aspects = calculate_vedic_aspects(planets)

        if strengths:
            strength_lines = []
            for p_name, s_data in strengths.items():
                if isinstance(s_data, dict):
                    status = s_data.get("status", "neutral")
                    score = s_data.get("score", 0)
                    strength_lines.append(f"- {p_name.capitalize()}: {status} (strength: {score})")
                else:
                    strength_lines.append(f"- {p_name.capitalize()}: {s_data}")
            strengths_text = "\n[PLANETARY STRENGTH ASSESSMENT]\n" + "\n".join(strength_lines)

        if aspects:
            aspect_lines = []
            for asp in aspects[:10]:
                if isinstance(asp, dict):
                    aspect_lines.append(
                        f"- {asp.get('from', '?')} aspects {asp.get('to', '?')} ({asp.get('type', 'standard')})"
                    )
                elif isinstance(asp, str):
                    aspect_lines.append(f"- {asp}")
            if aspect_lines:
                strengths_text += "\n\n[VEDIC ASPECTS]\n" + "\n".join(aspect_lines)
    except Exception:
        pass

    # Compute prakriti, element distribution, and planet rankings from computed analyses
    computed_text = ""
    if computed:
        comp_parts = []

        rankings = computed.get("planet_rankings")
        if rankings and isinstance(rankings, dict):
            benefic = rankings.get("benefic", [])
            malefic = rankings.get("malefic", [])
            if benefic:
                names = [p.get("name", "?") if isinstance(p, dict) else str(p) for p in benefic[:3]]
                comp_parts.append(f"Strongest Benefics: {', '.join(names)}")
            if malefic:
                names = [p.get("name", "?") if isinstance(p, dict) else str(p) for p in malefic[:3]]
                comp_parts.append(f"Active Malefics: {', '.join(names)}")

        elements = computed.get("elements")
        if elements and isinstance(elements, dict):
            dom = max(elements, key=lambda k: elements[k] if isinstance(elements[k], (int, float)) else 0)
            comp_parts.append(f"Dominant Element: {dom.capitalize()}")

        if comp_parts:
            computed_text = "\n\n[PRE-COMPUTED ANALYSIS]\n" + "\n".join(f"- {c}" for c in comp_parts)

    # Dasha timeline context
    dasha_text = ""
    try:
        dasha_text = "\n\n[VIMSHOTTARI DASHA TIMELINE]\n" + format_dasha_info(chart_data)
    except Exception:
        pass

    return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}

[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[ALL PLANETARY POSITIONS]
{format_planets(planets)}

[ALL 12 HOUSES]
{format_all_houses(houses, planets)}

[ACTIVE YOGAS]
{format_yogas(yogas)}

[DOSHA STATUS]
{format_doshas(doshas)}
{strengths_text}
{computed_text}
{dasha_text}

[STRATEGIC QUESTION]
\"{query}\""""
