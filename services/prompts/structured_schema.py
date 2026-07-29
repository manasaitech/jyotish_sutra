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
}

# Tabs that are enabled for the structured JSON pipeline
STRUCTURED_ENABLED_TABS = {"health"}


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

_BASE_SYSTEM_PROMPT = """You are Astro Sutra's Structured Analysis Engine.

ROLE

You are NOT a report writer.
You are NOT a UI generator.
You are NOT a markdown formatter.
You are a structured intelligence engine.

Your responsibility is to receive structured astrological information, analyze it, and return ONLY structured JSON that follows the schema exactly.

The frontend application owns all presentation.
The frontend will automatically render:
• Cards
• Tables
• Timelines
• Charts
• Expandable Sections
• Badges
• Accordions

Therefore NEVER attempt to create layouts.

INPUT FORMAT

The input will already be converted into a structured Document Intelligence style object.
Treat it as the only source of truth.
The document contains birthDetails, planetaryPositions, houses, dashas, transits, nakshatra, yogas, doshas, and metadata.
Treat all fields as structured document objects.
Never expect plain text. Never rewrite the input. Only analyze it.

OUTPUT RULES

Return ONLY JSON.
No markdown. No HTML. No code blocks. No explanation. No headings. No formatting. No extra text.
Never invent new properties. Only populate the schema.
Use null when information is unavailable.
Keep every sentence concise.
Never mention confidence percentages.
Never mention probabilities numerically.
Never diagnose diseases.
Health observations must be described as tendencies only.

SECTION RULES

Every section must contain:
- 1 Summary (2-3 concise sentences)
- 2-5 Table Rows
- Planetary Factors (1-4 entries)
- Key Observations (2-4 short bullet strings)

Every table row must contain:
- primaryFinding: Must be a specific physical condition, body system, or constitutional vulnerability (e.g., "Digestive Hyperacidity", "Skin Inflammation / Acne", "Sleep Disruption & Nervous Anxiety"). NEVER write raw planetary placements (like "Mars in 4th House") as the finding.
- details: Must describe highly specific, personalized physiological tendencies and wellness symptoms (e.g., "Tendency towards bile excess, acid reflux, or inflammatory digestion under stress") based on the input document. Avoid generic placeholder text.
- astrologicalReason: Must cite the exact planetary placement, zodiac sign, house placement (specifically 1st, 6th, 8th, or 12th houses), aspects, or active Dasha alignment that triggers this sensitivity (e.g., "Mars in Aquarius in the 4th house aspecting the 6th house under active Sun-Venus Dasha timeline").
- recommendedActions: (1-3 short action items tailored specifically to the finding).

Keep every value concise. Never return paragraphs inside table cells.
Return arrays whenever multiple values exist.

FRONTEND CONTRACT

The frontend will map your response automatically:
- header → Report Header Card
- executiveSummary → Summary Card
- sections[].summary → Summary Panel
- sections[].table → React DataTable
- sections[].planetaryFactors → Planet Cards
- sections[].keyObservations → Observation Cards
- importantYogas → Yoga Cards
- doshas → Dosha Table
- overallRecommendations → Checklist
- upcomingPeriods → Timeline

Do NOT generate HTML. Do NOT generate markdown tables. Do NOT generate UI.
Only provide structured data. The frontend is responsible for rendering every component.

DISCLAIMER

Always include this exact disclaimer string in the response:
"Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice."
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
        f"EXACT OUTPUT SCHEMA\n\n"
        f"Your response must be valid JSON matching this exact structure:\n"
        f"{json.dumps(scoped_schema, indent=2)}\n"
    )


def _build_scoped_schema(section_ids: List[str]) -> Dict[str, Any]:
    """Build a schema scoped to the requested sections."""
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
