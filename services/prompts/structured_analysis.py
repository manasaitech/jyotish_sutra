# -*- coding: utf-8 -*-
"""
Structured Analysis Orchestrator — End-to-end pipeline runner.

Orchestrates the full structured analysis pipeline:
    1. Build the structured input document (Document Understanding Layer)
    2. Build the scoped system prompt
    3. Call the LLM
    4. Extract and parse JSON from the LLM response
    5. Validate schema structure
    6. Return the validated structured report dict

This module is the single entry point that the API endpoint calls.
"""

from typing import Dict, List, Any, Optional
import json
import re
import traceback

from services.prompts.structured_schema import (
    get_structured_system_prompt,
    is_structured_enabled,
)
from services.prompts.document_builder import build_analysis_document
from services.llm.factory import LLMFactory


def run_structured_analysis(
    chart_data: dict,
    profile: dict = None,
    computed: dict = None,
    section_ids: list = None,
    history: list = None,
) -> Optional[Dict[str, Any]]:
    """
    Run the full structured analysis pipeline.

    Args:
        chart_data: Raw chart data dict (planets, houses, metadata, etc.)
        profile: User profile dict (name, DOB, TOB, etc.)
        computed: Pre-computed analyses (prakriti, elements, etc.)
        section_ids: Which sections to analyze (e.g. ["health"])
        history: Conversation history (currently unused for initial reads)

    Returns:
        Validated structured report dict, or None if the pipeline fails.
    """
    section_ids = section_ids or ["health"]
    profile = profile or {}
    computed = computed or {}

    try:
        # ── Step 1: Build Structured Input Document ──
        input_document = build_analysis_document(
            chart_data=chart_data,
            profile=profile,
            computed=computed,
            section_ids=section_ids,
        )

        # ── Step 2: Build System Prompt ──
        system_prompt = get_structured_system_prompt(section_ids)

        # ── Step 3: Build User Prompt (the structured document) ──
        user_prompt = json.dumps(input_document, indent=2, default=str)

        # ── Step 4: Call LLM ──
        client = LLMFactory.get_client()
        raw_response = client.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=900,
        )

        if not raw_response:
            print("[StructuredAnalysis] LLM returned empty response")
            return None

        # ── Step 5: Extract JSON from LLM response ──
        parsed = _extract_json(raw_response)
        if parsed is None:
            print(f"[StructuredAnalysis] Failed to extract JSON from LLM response. Raw (first 500 chars): {raw_response[:500] if raw_response else None}")
            return None

        # ── Step 5.5: Check for API error response JSON ──
        if isinstance(parsed, dict) and "error" in parsed:
            print(f"[StructuredAnalysis] LLM / API returned error JSON: {parsed}")
            return None

        # ── Step 6: Validate Schema ──
        validated = _validate_report_schema(parsed)
        if validated is None:
            print(f"[StructuredAnalysis] Schema validation failed. Root keys: {list(parsed.keys()) if isinstance(parsed, dict) else type(parsed)}")
            return None

        return validated

    except Exception as e:
        print(f"[StructuredAnalysis] Pipeline error: {e}")
        traceback.print_exc()
        return None


# ═══════════════════════════════════════════════════════════════
# JSON EXTRACTION — Robust parsing of LLM output
# ═══════════════════════════════════════════════════════════════

def _extract_json(raw: str) -> Optional[Dict[str, Any]]:
    """
    Extract a JSON object from the LLM response.

    Handles common LLM quirks:
    - Response wrapped in markdown code fences (```json ... ```)
    - Leading/trailing text outside the JSON object
    - Minor formatting issues
    """
    if not raw or not isinstance(raw, str):
        return None

    text = raw.strip()

    # Strategy 1: Direct parse (ideal case — LLM returned clean JSON)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract from markdown code fences
    code_fence_pattern = r'```(?:json)?\s*\n?(.*?)\n?```'
    matches = re.findall(code_fence_pattern, text, re.DOTALL)
    for match in matches:
        try:
            return json.loads(match.strip())
        except json.JSONDecodeError:
            continue

    # Strategy 3: Find the outermost { ... } block
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # Strategy 4: Try fixing common issues (trailing commas, etc.)
    if first_brace != -1 and last_brace != -1:
        candidate = text[first_brace:last_brace + 1]
        # Remove trailing commas before } or ]
        fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

    return None


# ═══════════════════════════════════════════════════════════════
# SCHEMA VALIDATION — Structural checks
# ═══════════════════════════════════════════════════════════════

def _validate_report_schema(data: Any) -> Optional[Dict[str, Any]]:
    """
    Validate and robustly normalize the parsed JSON to match the expected report structure.

    Handles common LLM structure deviations:
    - Root is a list of sections instead of a dict
    - Root is a single section directly
    - Root is wrapped by a tab-name key (e.g. {"finance": {...}})
    - Table rows or actions are dicts/strings instead of lists
    """
    if not isinstance(data, dict):
        if isinstance(data, list):
            data = {"sections": data}
        else:
            return None

    # 1. Normalize root wrap
    report = data.get("report")
    if report is None:
        if "sectionId" in data or "table" in data or "planetaryFactors" in data:
            report = {"sections": [data]}
            data = {"report": report}
        elif "sections" in data or "header" in data:
            report = data
            data = {"report": report}
        else:
            from services.prompts.structured_schema import STRUCTURED_ENABLED_TABS
            found_tab = None
            found_key = None
            for key in data:
                if key in STRUCTURED_ENABLED_TABS and isinstance(data[key], (dict, list)):
                    found_tab = data[key]
                    found_key = key
                    break
            if found_tab:
                if isinstance(found_tab, list):
                    report = {"sections": found_tab}
                elif isinstance(found_tab, dict):
                    if "sectionId" not in found_tab:
                        found_tab["sectionId"] = found_key
                    report = {"sections": [found_tab]}
                data = {"report": report}
            else:
                return None

    if not isinstance(report, dict):
        return None

    # Ensure essential top-level keys exist (with defaults for missing ones)
    report.setdefault("header", {
        "title": "Vedic Analysis Report",
        "reportType": "Structured Analysis",
        "generatedDate": "",
        "birthSummary": "",
    })
    report.setdefault("executiveSummary", "")
    report.setdefault("sections", [])
    report.setdefault("overallRecommendations", [])
    report.setdefault("importantYogas", [])
    report.setdefault("doshas", [])
    report.setdefault("upcomingPeriods", [])
    report.setdefault(
        "disclaimer",
        "Astrological interpretations indicate tendencies and should not be considered medical, legal, or financial advice.",
    )

    # 2. Normalize and validate sections array
    if not isinstance(report["sections"], list):
        if isinstance(report["sections"], dict):
            report["sections"] = [report["sections"]]
        else:
            report["sections"] = []

    cleaned_sections = []
    for section in report["sections"]:
        if not isinstance(section, dict):
            continue
        section.setdefault("sectionId", "unknown")
        section.setdefault("title", "Analysis")
        section.setdefault("summary", "")

        # Table rows normalization
        table = section.get("table")
        if not isinstance(table, list):
            if isinstance(table, dict):
                table = [table]
            else:
                table = []

        cleaned_table = []
        for row in table:
            if not isinstance(row, dict):
                continue
            row.setdefault("primaryFinding", "")
            row.setdefault("details", "")
            row.setdefault("astrologicalReason", "")

            # Actions array normalization
            actions = row.get("recommendedActions")
            if isinstance(actions, str):
                if "," in actions:
                    row["recommendedActions"] = [a.strip() for a in actions.split(",") if a.strip()]
                else:
                    row["recommendedActions"] = [actions.strip()]
            elif not isinstance(actions, list):
                row["recommendedActions"] = []
            else:
                row["recommendedActions"] = [str(a) for a in actions if a is not None]

            cleaned_table.append(row)
        section["table"] = cleaned_table

        # Planetary factors normalization
        pf = section.get("planetaryFactors")
        if not isinstance(pf, list):
            if isinstance(pf, dict):
                pf = [pf]
            else:
                pf = []
        cleaned_pf = []
        for factor in pf:
            if not isinstance(factor, dict):
                continue
            factor.setdefault("planet", "")
            factor.setdefault("impact", "")
            factor.setdefault("reason", "")
            cleaned_pf.append(factor)
        section["planetaryFactors"] = cleaned_pf

        # Key observations normalization
        obs = section.get("keyObservations")
        if isinstance(obs, str):
            section["keyObservations"] = [obs]
        elif not isinstance(obs, list):
            section["keyObservations"] = []
        else:
            section["keyObservations"] = [str(o) for o in obs if o is not None]

        cleaned_sections.append(section)

    report["sections"] = cleaned_sections
    return data
