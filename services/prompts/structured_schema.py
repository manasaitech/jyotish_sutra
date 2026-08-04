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
    "remedies": {
        "sectionId": "remedies",
        "title": "Remedies & Mitigations",
        "focus": (
            "Vedic remedies for afflicted planets, active Dasha corrections, "
            "gemstone recommendations, mantras, charity (Daana), and daily rituals."
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
    "strategic_insights": {
        "sectionId": "strategic_insights",
        "title": "Strategic Insights & Decision Intelligence",
        "focus": (
            "Evidence-based strategic advisory for personal and business decisions. "
            "Evaluates planetary timing, dasha activation, transit support, yoga strength, "
            "risk vs opportunity balance, and timing windows. Provides probabilistic guidance "
            "with supporting and contradicting factors, actionable recommendations, "
            "and confidence assessments. Covers career changes, business launches, investments, "
            "partnerships, relocations, education, marriage timing, and institutional planning."
        ),
    },
    "past_events": {
        "sectionId": "past_events",
        "title": "Past Event Discovery",
        "focus": (
            "Investigative event discovery analyzing dasha-activated house signatures, "
            "yoga trigger periods, and planet-house convergence patterns to identify "
            "specific life events: career breakthroughs, marriage, property purchase, "
            "foreign travel, education milestones, health events, financial gains/losses, "
            "business start/close, relocation, and transformative life changes. "
            "Each event scored by likelihood (0-100), time confidence, and evidence count."
        ),
    },
}

# Tabs that are enabled for the structured JSON pipeline
STRUCTURED_ENABLED_TABS = {"health", "food", "remedies", "career", "finance", "personality", "spiritual", "overview", "strategic_insights", "past_events"}


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
- Keep all values ultra-concise (all summary, details, and executiveSummary text must be exactly 1 short sentence).
- Lessen all horoscopic explanations: keep the 'astrologicalReason' to a brief fragment citing only the planets, houses, and active dasha (e.g. 'Venus in 11th Virgo, Sun-Venus Dasha') without elaborate prose.
- Limit overallRecommendations, importantYogas, doshas, and upcomingPeriods to exactly 1 key item each.
- Never mention confidence percentages or diagnose diseases.
- Health observations = tendencies only.
- Every section: 1 summary (1 short sentence), exactly 1 table row.
- CRITICAL: Keep all text descriptions, details, and astrological reasons brief, concise, and direct. The entire JSON response must be under 200 tokens total to minimize generation latency and prevent truncation.

TIMELINE RULE: Every table row must include specific predictive timelines (exact year+month range, e.g., "[Month Year] to [Month Year]") derived strictly from the Vimshottari Dasha dates provided in the user's chart context. Never use generic or hardcoded timelines. Place timelines in 'details' or 'astrologicalReason'.

DISCLAIMER: Always include: "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice."
"""

SECTION_RULES: Dict[str, str] = {
    "health": "health: Exactly 1 row: \"Primary Health Vulnerability\" detailing physiological tendencies. astrologicalReason=cite planet, house (1/6/8/12), aspects, Dasha. recommendedActions=exactly 1 restorative action.",
    "food": "food: Exactly 1 row: \"Prakriti Dietary Plan\" detailing specific foods/herbs to favor/avoid based on Prakriti. astrologicalReason=Prakriti score+planetary afflictions. recommendedActions=exactly 1 specific food recommendation with timing.",
    "remedies": "remedies: Exactly 1 row: \"Core Remedial Practice\" detailing exact mantra and gemstone recommendation. astrologicalReason=affliction+Dasha timeline. recommendedActions=exactly 1 actionable step with timing.",
    "career": "career: Exactly 1 row: \"Top Career Domains\" detailing top 3 domains from 10th house/lord/Amatyakaraka. astrologicalReason=10th house dynamics+Dasha timeline. recommendedActions=exactly 1 professional recommendation.",
    "finance": "finance: Exactly 1 row: \"Primary Wealth Sources & Favourable Period\" combining 2nd/11th houses with active Dasha timeline. astrologicalReason=2nd/11th lords+Dasha. recommendedActions=exactly 1 financial recommendation.",
    "personality": "personality: Exactly 1 row: \"Core Personality Pattern\" detailing psychological temperament and strengths. astrologicalReason=Lagna, Moon sign, Dasha transitions. recommendedActions=exactly 1 development action.",
    "spiritual": "spiritual: Exactly 1 row: \"Spiritual Activation & Path\" detailing meditation compatibility and karmic phase. astrologicalReason=4th/8th/12th houses, Ketu, Dasha. recommendedActions=exactly 1 spiritual action.",
    "overview": "overview: Exactly 1 row: \"Major Life Theme\" detailing current yoga activations and overall life path summary. astrologicalReason=chart ruler, yogas, Dasha. recommendedActions=exactly 1 strategic recommendation.",
    "strategic_insights": "strategic_insights: FIRST row must be \"Strategic Verdict\" with clear Recommended/Proceed with Caution/Delay/Avoid verdict. SECOND row=\"Key Supporting Factors\" listing favorable astrological indicators. THIRD row=\"Risk Factors\" listing challenges and unfavorable indicators. Subsequent rows=timing windows (Immediate/3M/6M/1Y) with specific dasha+transit evidence. astrologicalReason=planet+house+dasha+transit with natal promise vs timing comparison. recommendedActions=concrete strategic moves+precautions.",
    "past_events": "past_events: Each row=one discovered life event. primaryFinding=event category (e.g. \"Career Breakthrough\", \"Marriage\", \"Property Purchase\", \"Foreign Travel\"). details=estimated time window + likelihood score (0-100) + possible real-world manifestation. astrologicalReason=activated houses + dasha lord + supporting planets + triggered yogas with specific dates. recommendedActions=empty (past events have no actions). Order rows by likelihood score descending.",
    "doshas": "doshas: Read the `precomputed_dosha_analysis` object provided under the `document` key in the user prompt. DO NOT invent or alter any dosha name, strength, influence, mitigation, overall impact, practical impact, timelines, or activation checks. For each detected dosha in `precomputed_dosha_analysis.doshas`, populate the `dosha_list` array. Convert why_it_exists, why_it_is_reduced, challenges, strengths, and remedies into professional, flowing English prose. Populate the `summary` block (significant_doshas, currently_active, well_mitigated, highest_priority_area, detected_doshas_summary) using the precomputed values under `precomputed_dosha_analysis.summary`."
}


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
    rule_lines = []
    for sid in section_ids:
        config = SECTION_REGISTRY.get(sid)
        if config:
            section_focus_lines.append(
                f"- Section '{config['sectionId']}' (Title: \"{config['title']}\"): "
                f"Focus on: {config['focus']}"
            )
        rule = SECTION_RULES.get(sid)
        if rule:
            rule_lines.append(rule)

    section_focus_block = "\n".join(section_focus_lines) if section_focus_lines else "- Analyze all available domains."
    rules_block = "\n\n".join(rule_lines) if rule_lines else "- No specific domain rules."

    # Build scoped schema (only include requested section IDs)
    scoped_schema = _build_scoped_schema(section_ids)

    return (
        f"{_BASE_SYSTEM_PROMPT}\n\n"
        f"PER-SECTION TABLE ROW RULES:\n\n"
        f"{rules_block}\n\n"
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
    } if not (len(section_ids) == 1 and section_ids[0] not in ["doshas", "strategic_insights", "past_events"]) else {
        "report": {
            "header": {
                "title": "",
                "reportType": "",
                "generatedDate": "",
                "birthSummary": "",
            },
            "executiveSummary": "",
            "sections": sections,
            "disclaimer": "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice.",
        }
    }


def is_structured_enabled(tab: str) -> bool:
    """Check if a tab is enabled for the structured JSON pipeline."""
    return tab in STRUCTURED_ENABLED_TABS
