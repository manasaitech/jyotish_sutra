# -*- coding: utf-8 -*-
"""
Career Tab - Layer 3: LLM Writer Prompt Module.

The LLM receives a pre-computed Career Evidence Brief from the
Reasoning Engine (Layer 2) and writes beautiful prose.
It NEVER independently interprets planetary positions.

Architecture:
  Layer 1 (chart_generator) -> raw facts
  Layer 2 (career_reasoning) -> synthesized evidence brief
  Layer 3 (this file) -> LLM writes prose from evidence brief
"""

from services.prompts.tabs.shared import format_profile, format_history

# -------------------------------------------------------------
# SYSTEM PROMPTS
# -------------------------------------------------------------

CAREER_INITIAL_SYSTEM = """You are AstroSutra AI - a master Vedic Career Analyst and Professional Strategist.

[WARNING] CRITICAL ARCHITECTURE:
1. You are Layer 3 of a 3-layer system. The Astrology Reasoning Engine (Layer 2) has ALREADY computed all planetary strengths, service vs business alignment, Amatyakaraka, and dasha activation, selecting the top 3 career domains.
2. LANGUAGE: Write in high-quality, professional, and clear ENGLISH.
3. FORMAT: Structure your response using markdown headers and clear bullet points for readability.
4. STRICT RULES:
   - Use bulleted lists to present top predictions, planetary evidence, and remedies. Avoid text-heavy prose blocks.
   - NEVER use emojis in the prose.
   - NEVER invent or re-interpret astrology. Stick strictly to the pre-computed net conclusions in the evidence brief.
   - Do NOT use percentage numbers in prose. Use qualitative terms.
   - HIGHLIGHT key terms (like **top 3 careers**, active planets, active dashas, and key recommendations) by wrapping them in double asterisks so they are immediately visible. Do not default to any specific industry or employment model unless indicated by the evidence.

STRICT THREE-PART SECTION FLOW:

### Direct Career Prediction
Address the user by name. Immediately deliver the direct, actual prediction of their professional path. Explicitly present their **top 3 career recommendations** (drawn strictly from the computed domains in the career evidence brief) ranked by probability as a bulleted list. Provide a clear verdict on whether their chart aligns with a structured employment model (job/service) or self-employment/entrepreneurship, citing active vs dormant fields. Do not use generic examples from templates.

### Astrological Clarification
In bullet points, explain the planetary alignment reasons, house lords (1st, 2nd, 6th, 10th, 11th), sign placements, active Dashas, and the Jaimini karakas (like **Amatyakaraka** or Atmakaraka) explaining why these top careers fit their cosmic footprint and what protects or challenges their growth.

### Remedial & Actionable Strategy
Provide concrete career tips, study habits, mentor/boss alignment strategies, and specific remedial planetary advice (such as daily routine changes, gemstone alignments, or mantra focuses) to clear professional blockages and maximize success, formatted as clear bullet points.

Target Length: 250-400 words.
"""


CAREER_CHAT_SYSTEM = """You are AstroSutra AI - a master Vedic Career Advisor answering a follow-up query.

[WARNING] CRITICAL:
1. You receive a pre-computed CAREER EVIDENCE BRIEF. All planetary interactions, Amatyakaraka, and employment type alignments have ALREADY been computed by the Reasoning Engine. Do NOT re-interpret planets independently.
2. LANGUAGE: Answer in clear, high-quality ENGLISH.
3. FORMAT: Structure your response using markdown headers (###) and clear bullet points. No emojis.
4. HIGHLIGHTS: Wrap important keywords, recommended domains, active dashas, and specific strategic advice in double asterisks (`**`) for easy scanning.

RULES:
1. Start directly on Line 1 addressing the user by name with a direct, actual career prediction/answer to their question.
2. Structure your response into clear bullet points:
   - **Direct Answer**: Provide a direct prediction/answer to the query with specific timing.
   - **Astrological Clarification**: In bullet points, explain planetary interactions, Amatyakaraka placement, and house lords.
   - **Remedial & Guidance**: List concrete, strategic career tips and planetary remedies.

Target Length: 200-350 words.
"""


# -------------------------------------------------------------
# PUBLIC API
# -------------------------------------------------------------

def get_career_prompt(is_initial: bool = True, sub_tab: str = "overview") -> str:
    """Return the system prompt for initial overview or follow-up chat."""
    # Note: KALA_VIDYA uses a dedicated educational sub-tab configuration.
    # We fallback to standard career chat system for chat replies.
    if sub_tab == "kala_vidya" or sub_tab == "receptivity":
        return KALA_VIDYA_INITIAL_SYSTEM if is_initial else CAREER_CHAT_SYSTEM
    return CAREER_INITIAL_SYSTEM if is_initial else CAREER_CHAT_SYSTEM


def build_career_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    sub_tab: str = "overview",
    **kwargs,
) -> str:
    """
    Build the user prompt context for the Career tab.

    Invokes the Layer 2 Career Reasoning Engine to produce a synthesized
    evidence brief, then formats it for the LLM.
    """
    st = kwargs.get("sub_tab") or sub_tab or "overview"

    hist_str = format_history(history)
    hist_part = f"[CONVERSATION HISTORY]\n{hist_str}\n\n" if hist_str and hist_str != "No previous conversation." else ""

    if st == "kala_vidya" or st == "receptivity":
        from services.astrology.kala_vidya_engine import (
            analyze_kala_vidya, format_kala_vidya_subset_context,
        )
        kv_analysis = analyze_kala_vidya(chart_data)
        subset_text = format_kala_vidya_subset_context(kv_analysis, profile=profile, chart_data=chart_data)
        return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}

{subset_text}

[USER QUERY]
\"{query}\""""

    # Standard Career Overview: invoke the new reasoning engine (Layer 2)
    evidence_text = _build_evidence_context(chart_data, computed)

    return f"""{hist_part}[USER PROFILE]
{format_profile(profile)}

{evidence_text}

[USER QUESTION]
\"{query}\""""


# -------------------------------------------------------------
# INTERNAL HELPERS
# -------------------------------------------------------------

def _build_evidence_context(chart_data: dict, computed: dict = None) -> str:
    """Invoke the career reasoning engine and format the evidence brief."""
    try:
        from backend.astrology.career_reasoning import (
            compute_career_evidence,
            format_career_evidence_for_prompt,
        )
        evidence = compute_career_evidence(chart_data, computed)
        return format_career_evidence_for_prompt(evidence)
    except Exception as e:
        # Fallback to legacy format if reasoning engine fails
        return _legacy_career_context(chart_data, computed, str(e))


def _legacy_career_context(
    chart_data: dict,
    computed: dict = None,
    error_msg: str = "",
) -> str:
    """Fallback: format raw planetary data if reasoning engine is unavailable."""
    from services.prompts.tabs.shared import (
        format_core_chart, format_planets,
        format_houses_subset, format_yogas,
    )

    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    yogas = chart_data.get("yogas", [])
    meta = chart_data.get("metadata", {})

    dasha_str = f"Current Dasha: {chart_data.get('current_dasha') or meta.get('current_dasha') or 'Not specified'}"

    fallback_note = ""
    if error_msg:
        fallback_note = f"\n[NOTE: Career Reasoning engine unavailable ({error_msg}). Using raw data.]\n"

    return f"""{fallback_note}[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[CAREER & SUPPORTING HOUSES (2nd, 3rd, 5th, 6th, 8th, 9th, 10th, 11th)]
{format_houses_subset(houses, planets, [2, 3, 5, 6, 8, 9, 10, 11])}

[ALL PLANETARY POSITIONS]
{format_planets(planets)}

[DASHA TIMELINE]
{dasha_str}"""


# -------------------------------------------------------------
# KALA VIDYA LEGACY DEFINITIONS
# -------------------------------------------------------------

KALA_VIDYA_INITIAL_SYSTEM = """You are AstroSutra AI — an expert Vedic Educational Strategist specializing in the 64 Classical Kalas and Shishya Grahana.

MANDATES & CONSTRAINTS:
1. Ground insights in 4th lord (Vidya), 5th lord (Memory), 9th lord (Guru), and 3rd lord (Skill).
2. Use Devanagari script names for Kalas.
3. Target Length: 200-250 words total. No numeric scores.
"""
