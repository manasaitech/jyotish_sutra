# -*- coding: utf-8 -*-
"""
Health Tab - Layer 3: LLM Writer Prompt Module.

The LLM receives a pre-computed Health Evidence Brief from the
Reasoning Engine (Layer 2) and writes beautiful prose.
It NEVER independently interprets planetary positions.

Architecture:
  Layer 1 (chart_generator) -> raw facts
  Layer 2 (health_reasoning) -> synthesized evidence brief
  Layer 3 (this file) -> LLM writes prose from evidence brief
"""

from services.prompts.tabs.shared import format_profile, format_history

# -------------------------------------------------------------
# SYSTEM PROMPTS
# -------------------------------------------------------------

HEALTH_INITIAL_SYSTEM = """You are JyotishaSutra AI - a master Vedic Health Report Writer.

[WARNING] CRITICAL ARCHITECTURE:
1. You are Layer 3 of a 3-layer system. The Astrology Reasoning Engine (Layer 2) has ALREADY computed all planetary affliction scores, interactions, mitigations, dasha activation, and net conclusions.
2. LANGUAGE: Write in high-quality, professional, and clear ENGLISH.
3. FORMAT: Structure your response using markdown headers and clear bullet points for readability.
4. STRICT RULES:
   - Use bullet points to list specific conditions, planetary elements, and lifestyle remedies. Avoid text-heavy prose blocks.
   - NEVER use emojis in the prose.
   - NEVER invent or re-interpret astrology. Stick strictly to the pre-computed net conclusions in the evidence brief.
   - Do NOT use percentage numbers in prose. Use qualitative terms.
   - HIGHLIGHT key terms (like **skin disorder**, **sleep issues**, **Pitta-dominant**, active planets, active dashas, specific herbs, and vital recommendations) by wrapping them in double asterisks so they are immediately visible.

STRICT THREE-PART SECTION FLOW:

### Direct Health Prediction
Address the user by name. Immediately deliver the direct, actual prediction of their primary health vulnerabilities, current active sensitivities, and overall vitality grade from the CONSTITUTION and INDICATIONS sections. State exactly what is active or manifesting right now in clear bullet points.

### Astrological Clarification
In bullet points, explain the planetary alignment reasons, houses (1st, 6th, 8th, 12th), sign placements, active Dashas, and aspect/mitigation interactions (e.g. how a malefic placement causes a vulnerability, but a benefic aspect like **Jupiter's aspect** or Venus provides protective mitigation).

### Remedial & Lifestyle Guidance
Provide practical daily routine habits (like sleep discipline, eating schedules) and customized Ayurvedic remedies or herbs (such as **Ashwagandha**, **Triphala**, or **Brahmi**) tailored to their dominant Dosha (Vata/Pitta/Kapha) and active concern areas, formatted as a bulleted list.

You MUST include this mandatory medical disclaimer at the end of the section:
"If you experience persistent fatigue, pain, sleep issues, digestive discomfort, or any new symptoms, always consult a qualified medical professional; astrological estimation is not a substitute for medical treatment."

Target Length: 250-400 words.
"""


HEALTH_CHAT_SYSTEM = """You are JyotishaSutra AI - a master Vedic Health Advisor answering a follow-up query.

[WARNING] CRITICAL:
1. You receive a pre-computed HEALTH EVIDENCE BRIEF. All planetary interactions, mitigations, and conflicts have ALREADY been computed by the Reasoning Engine. Do NOT re-interpret planets independently.
2. LANGUAGE: Answer in clear, high-quality ENGLISH.
3. FORMAT: Structure your response using markdown headers (###) and clear bullet points. No emojis.
4. HIGHLIGHTS: Wrap important keywords, conditions (e.g., **skin disorders**, **insomnia**), active dashas, and key remedies in double asterisks (`**`) for easy scanning.

RULES:
1. Start directly on Line 1 addressing the user by name with a direct, actual health prediction/answer to their question.
2. Structure your response into clear bullet points:
   - **Direct Answer**: Provide a direct prediction/answer to the query with specific timing.
   - **Astrological Clarification**: In bullet points, explain planetary interactions, aspects, and mitigations (e.g., how **Jupiter's benefic aspect** reduces a malefic effect).
   - **Remedial & Guidance**: List concrete, daily Ayurvedic remedies, lifestyle advice, and this mandatory medical disclaimer:
     "Astrological estimations are meant to serve as a guide and should not be used as a substitute for professional medical counsel."

Target Length: 200-350 words.
"""


# -------------------------------------------------------------
# PUBLIC API
# -------------------------------------------------------------

def get_health_prompt(is_initial: bool = True) -> str:
    """Return the system prompt for initial overview or follow-up chat."""
    return HEALTH_INITIAL_SYSTEM if is_initial else HEALTH_CHAT_SYSTEM


def build_health_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    """
    Build the user prompt context for the Health tab.

    Invokes the Layer 2 Reasoning Engine to produce a synthesized
    evidence brief, then formats it for the LLM.
    """
    # Try the new reasoning engine (Layer 2)
    evidence_text = _build_evidence_context(chart_data, computed)

    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

{evidence_text}

[USER QUESTION]
\"{query}\""""


# -------------------------------------------------------------
# INTERNAL HELPERS
# -------------------------------------------------------------

def _build_evidence_context(chart_data: dict, computed: dict = None) -> str:
    """Invoke the reasoning engine and format the evidence brief."""
    try:
        from backend.astrology.health_reasoning import (
            compute_health_evidence,
            format_evidence_for_prompt,
        )
        evidence = compute_health_evidence(chart_data, computed)
        return format_evidence_for_prompt(evidence)
    except Exception as e:
        # Fallback to legacy format if reasoning engine fails
        return _legacy_health_context(chart_data, computed, str(e))


def _legacy_health_context(
    chart_data: dict,
    computed: dict = None,
    error_msg: str = "",
) -> str:
    """Fallback: format raw planetary data if reasoning engine is unavailable."""
    from services.prompts.tabs.shared import (
        format_core_chart, format_planets,
        format_houses_subset, format_doshas, format_dasha_info,
    )

    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    doshas = chart_data.get("doshas", {})

    dasha_timeline = format_dasha_info(chart_data)

    prakriti_info = "Not computed."
    if computed and computed.get("prakriti"):
        p = computed["prakriti"]
        prakriti_info = (
            f"Vata: {p.get('vata', 0)}% | Pitta: {p.get('pitta', 0)}% | "
            f"Kapha: {p.get('kapha', 0)}%\n"
            f"Dominant Dosha: {p.get('dominant_dosha', 'N/A')}"
        )

    fallback_note = ""
    if error_msg:
        fallback_note = f"\n[NOTE: Reasoning engine unavailable ({error_msg}). Using raw data.]\n"

    return f"""{fallback_note}[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[ACTIVE HEALTH DASHA TIMELINE]
{dasha_timeline}

[HEALTH & ROGA HOUSES (1st, 6th, 8th, 12th, 4th)]
{format_houses_subset(houses, planets, [1, 6, 8, 12, 4])}

[ALL PLANETARY POSITIONS]
{format_planets(planets)}

[AYURVEDIC PRAKRITI]
{prakriti_info}

[DOSHAS]
{format_doshas(doshas)}"""
