# -*- coding: utf-8 -*-
"""
Structured Analysis Schema & System Prompt.

This module defines the MASTER OUTPUT SCHEMA and the production system prompt
used by the Structured Analysis Engine. It is the single source of truth
(the "contract") between the backend LLM pipeline and the frontend React renderer.

Every tab reuses this schema — tabs are distinguished by `sectionId` values.
"""

from typing import List, Dict, Any, Optional
import json

# ═══════════════════════════════════════════════════════════════
# SECTION REGISTRY — Maps tab IDs to section configs
# ═══════════════════════════════════════════════════════════════

SECTION_REGISTRY: Dict[str, Dict[str, str]] = {
    "health": {
        "sectionId": "health",
        "title": "Health & Wellness",
        "focus": (
            "Physical constitution, Ayurvedic Prakriti (Vata/Pitta/Kapha balance), "
            "disease vulnerabilities, organ system tendencies, sleep & nervous health, "
            "skin integrity, musculoskeletal resilience, and Dasha-activated health windows."
        ),
    },
    "career": {
        "sectionId": "career",
        "title": "Career & Professional Path",
        "focus": (
            "Professional aptitude, service vs business alignment, top career domains, "
            "Amatyakaraka influence, 10th house activations, promotion windows, "
            "and Dasha-triggered career breakthroughs."
        ),
    },
    "finance": {
        "sectionId": "finance",
        "title": "Finance & Wealth",
        "focus": (
            "Wealth accumulation patterns, 2nd/11th house dynamics, Dhana Yogas, "
            "investment tendencies, financial risk profile, and major wealth windows."
        ),
    },
    "marriage": {
        "sectionId": "marriage",
        "title": "Marriage & Relationships",
        "focus": (
            "Relationship compatibility, 7th house dynamics, Navamsha indicators, "
            "spouse characteristics, marriage timing, and relationship harmony patterns."
        ),
    },
    "personality": {
        "sectionId": "personality",
        "title": "Personality & Temperament",
        "focus": (
            "Core personality traits, Ascendant influence, Moon sign emotional patterns, "
            "behavioral tendencies, communication style, and inner vs outer persona."
        ),
    },
    "spiritual": {
        "sectionId": "spiritual",
        "title": "Spiritual Growth",
        "focus": (
            "Moksha houses (4th, 8th, 12th), spiritual inclinations, past life karmic patterns, "
            "meditation and sadhana compatibility, guru connections, and dharmic path."
        ),
    },
    "food": {
        "sectionId": "food",
        "title": "Diet & Nutrition",
        "focus": (
            "Ayurvedic dietary recommendations based on Prakriti, favorable and unfavorable foods, "
            "meal timing, digestive fire (Agni) strength, and seasonal dietary adjustments."
        ),
    },
    "overview": {
        "sectionId": "overview",
        "title": "Horoscope Overview",
        "focus": (
            "Overall life trajectory, key planetary strengths, active Dasha effects, "
            "dominant yogas, major life themes, and general cosmic outlook."
        ),
    },
    "doshas": {
        "sectionId": "doshas",
        "title": "Doshas & Afflictions",
        "focus": (
            "Vedic astrology doshas present in the horoscope (Manglik, Kaal Sarp, Pitra, Shrapit, "
            "Eclipse/Grahan, Guru Chandal, Kemadruma, Chandra, Daridra, and house/lord afflictions), "
            "analyzing their severity, activation status, and practical remedies."
        ),
    },
}

# Tabs that are enabled for the structured JSON pipeline
STRUCTURED_ENABLED_TABS = {"health", "food", "remedies", "career", "finance", "personality", "spiritual", "overview"}


# ═══════════════════════════════════════════════════════════════
# MASTER OUTPUT SCHEMA
# ═══════════════════════════════════════════════════════════════

MASTER_OUTPUT_SCHEMA: Dict[str, Any] = {
    "report": {
        "header": {
            "title": "",
            "reportType": "",
            "generatedDate": "",
            "birthSummary": "",
        },
        "executiveSummary": "",
        "sections": [
            {
                "sectionId": "",
                "title": "",
                "summary": "",
                "table": [
                    {
                        "primaryFinding": "",
                        "details": "",
                        "astrologicalReason": "",
                        "recommendedActions": [],
                    }
                ],
                "planetaryFactors": [
                    {
                        "planet": "",
                        "impact": "",
                        "reason": "",
                    }
                ],
                "keyObservations": [],
            }
        ],
        "overallRecommendations": [],
        "importantYogas": [
            {
                "name": "",
                "effect": "",
                "reason": "",
            }
        ],
        "doshas": [
            {
                "name": "",
                "severity": "",
                "reason": "",
                "recommendedRemedy": "",
            }
        ],
        "upcomingPeriods": [
            {
                "period": "",
                "effect": "",
                "suggestion": "",
            }
        ],
        "disclaimer": "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice.",
    }
}


# ═══════════════════════════════════════════════════════════════
# SYSTEM PROMPT BUILDER
# ═══════════════════════════════════════════════════════════════

_BASE_SYSTEM_PROMPT = """You are Astro Sutra's Structured Analysis Engine. Return ONLY valid JSON matching the schema. No markdown, HTML, code blocks, or extra text.

RULES:
- Populate only schema properties. Use null when unavailable.
- Keep all values concise (no paragraphs in table cells).
- Never mention confidence percentages or diagnose diseases.
- Health observations = tendencies only.
- Every section: 1 summary (2-3 sentences), 2-5 table rows, 1-4 planetaryFactors, 2-4 keyObservations.

TIMELINE RULE: Every table row must include specific predictive timelines (exact year+month range, e.g. "Oct 2026 to Jun 2028") derived from Vimshottari Dasha dates. Never use generic timelines. Place timelines in 'details' or 'astrologicalReason'.

PER-SECTION TABLE ROW RULES:

health: primaryFinding=specific body system/condition (NOT raw placements). details=physiological tendencies. astrologicalReason=cite planet, house (1/6/8/12), aspects, Dasha. recommendedActions=1-3 restorative items.

food: primaryFinding=Prakriti diet type or therapeutic diet (e.g. "Pitta-Cooling Lunch"). details=specific foods/herbs to favor/avoid based on Prakriti+chart vulnerabilities. astrologicalReason=Prakriti score+planetary afflictions. recommendedActions=specific food items with timing.

remedies: primaryFinding=remedy category (Mantra/Gemstone/Daana/Puja). details=exact mantra text+count, gemstone weight/metal/finger/day, or donation items/day. astrologicalReason=affliction+Dasha timeline. recommendedActions=actionable steps with timing.

career: FIRST row must be "Top Career Domains" with top 3 domains from 10th house/lord/Amatyakaraka. Subsequent rows=career phases/job-vs-business/timeline growth. astrologicalReason=10th house dynamics+Dasha timeline.

finance: FIRST row="Primary Wealth Sources" from 2nd/11th houses. SECOND row="Favourable Wealth Period" with exact timeline. Subsequent rows=savings/risk. astrologicalReason=2nd/11th lords+Dasha.

personality: primaryFinding=psychological pattern/temperament shift. details=strengths, emotional tendencies. astrologicalReason=Lagna, Moon sign, Dasha transitions.

spiritual: primaryFinding=spiritual activation/karmic phase. details=meditation, past-life patterns. astrologicalReason=4th/8th/12th houses, Ketu, Dasha.

overview: primaryFinding=major life theme/yoga activation. details=life path summary. astrologicalReason=chart ruler, yogas, Dasha.

doshas: Read the `precomputed_dosha_analysis` object provided under the `document` key in the user prompt. DO NOT invent or alter any dosha name, strength, influence, mitigation, overall impact, practical impact, timelines, or activation checks. For each detected dosha in `precomputed_dosha_analysis.doshas`, populate the `dosha_list` array. Convert why_it_exists, why_it_is_reduced, challenges, strengths, and remedies into professional, flowing English prose. Populate the `summary` block (significant_doshas, currently_active, well_mitigated, highest_priority_area, detected_doshas_summary) using the precomputed values under `precomputed_dosha_analysis.summary`.

DISCLAIMER: Always include: "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice."
"""


def get_structured_system_prompt(section_ids: List[str]) -> str:
    """
    Build the structured system prompt scoped to specific sections.

    Args:
        section_ids: List of section IDs to analyze (e.g. ["health"], ["career", "finance"])

    Returns:
        Complete system prompt string with schema and section focus instructions.
    """
    # Build section focus instructions
    section_focus_lines = []
    for sid in section_ids:
        config = SECTION_REGISTRY.get(sid)
        if config:
            section_focus_lines.append(
                f"- Section '{config['sectionId']}' (Title: \"{config['title']}\"): "
                f"Focus on: {config['focus']}"
            )

    section_focus_block = "\n".join(section_focus_lines) if section_focus_lines else "- Analyze all available domains."

    # Build scoped schema (only include requested section IDs)
    scoped_schema = _build_scoped_schema(section_ids)

    return (
        f"{_BASE_SYSTEM_PROMPT}\n\n"
        f"REQUESTED SECTIONS\n\n"
        f"You must produce analysis for exactly these sections:\n"
        f"{section_focus_block}\n\n"
        f"SCHEMA:\n"
        f"{json.dumps(scoped_schema, separators=(',', ':'))}\n"
    )


def _build_scoped_schema(section_ids: List[str]) -> Dict[str, Any]:
    """Build a schema scoped to the requested sections."""
    if "doshas" in section_ids:
        return {
            "report": {
                "header": {
                    "title": "",
                    "reportType": "",
                    "generatedDate": "",
                    "birthSummary": "",
                },
                "summary": {
                    "significant_doshas": 0,
                    "currently_active": 0,
                    "well_mitigated": 0,
                    "highest_priority_area": "",
                    "detected_doshas_summary": [],
                },
                "dosha_list": [
                    {
                        "dosha_name": "",
                        "detected": True,
                        "formation_strength": 0,
                        "current_influence": "",
                        "mitigation_status": "",
                        "overall_impact": "",
                        "practical_impact": "",
                        "why_it_exists": [],
                        "why_it_is_reduced": [],
                        "confidence": "",
                        "confidence_reason": "",
                        "challenges": [],
                        "strengths": [],
                        "life_areas_affected": {
                            "career": "",
                            "marriage": "",
                            "finance": "",
                            "health": "",
                            "children": "",
                        },
                        "activation_check": [],
                        "visual_timeline": [
                            {
                                "year": "",
                                "status": "",
                                "symbol": "",
                            }
                        ],
                        "recommended_remedies": {
                            "spiritual": [],
                            "lifestyle": [],
                            "practical": [],
                        }
                    }
                ],
                "disclaimer": "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice.",
            }
        }

    section_template = {
        "sectionId": "",
        "title": "",
        "summary": "",
        "table": [
            {
                "primaryFinding": "",
                "details": "",
                "astrologicalReason": "",
                "recommendedActions": [],
            }
        ],
        "planetaryFactors": [
            {"planet": "", "impact": "", "reason": ""}
        ],
        "keyObservations": [],
    }

    sections = []
    for sid in section_ids:
        config = SECTION_REGISTRY.get(sid)
        if config:
            section = dict(section_template)
            section["sectionId"] = config["sectionId"]
            section["title"] = config["title"]
            sections.append(section)

    return {
        "report": {
            "header": {
                "title": "",
                "reportType": "",
                "generatedDate": "",
                "birthSummary": "",
            },
            "executiveSummary": "",
            "sections": sections,
            "overallRecommendations": [],
            "importantYogas": [{"name": "", "effect": "", "reason": ""}],
            "doshas": [{"name": "", "severity": "", "reason": "", "recommendedRemedy": ""}],
            "upcomingPeriods": [{"period": "", "effect": "", "suggestion": ""}],
            "disclaimer": "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice.",
        }
    }


def is_structured_enabled(tab: str) -> bool:
    """Check if a tab is enabled for the structured JSON pipeline."""
    return tab in STRUCTURED_ENABLED_TABS
