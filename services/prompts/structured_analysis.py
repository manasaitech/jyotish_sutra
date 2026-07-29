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
            max_tokens=1500,
        )

        if not raw_response:
            print("[StructuredAnalysis] LLM returned empty response")
            return None

        # ── Step 5: Extract JSON from LLM response ──
        parsed = _extract_json(raw_response)
        if parsed is None:
            print(f"[StructuredAnalysis] Failed to extract JSON from LLM response. Raw (first 500 chars): {raw_response[:500]}")
            return None

        # ── Step 6: Validate Schema ──
        validated = _validate_report_schema(parsed)
        if validated is None:
            print(f"[StructuredAnalysis] Schema validation failed.")
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

def _validate_report_schema(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Validate that the parsed JSON matches the expected report structure.

    We don't enforce strict types on every field — just check that the
    top-level structure is correct and essential keys exist.
    Returns the data if valid, None otherwise.
    """
    if not isinstance(data, dict):
        return None

    # Accept { "report": { ... } } or just { "header": ..., "sections": ... }
    report = data.get("report")
    if report is None:
        # Maybe the LLM returned the report contents directly (without the "report" wrapper)
        if "sections" in data or "header" in data:
            report = data
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

    # Validate sections array
    if not isinstance(report["sections"], list):
        report["sections"] = []

    for section in report["sections"]:
        if not isinstance(section, dict):
            continue
        section.setdefault("sectionId", "unknown")
        section.setdefault("title", "Analysis")
        section.setdefault("summary", "")
        section.setdefault("table", [])
        section.setdefault("planetaryFactors", [])
        section.setdefault("keyObservations", [])

        # Validate table rows
        if isinstance(section["table"], list):
            for row in section["table"]:
                if isinstance(row, dict):
                    row.setdefault("primaryFinding", "")
                    row.setdefault("details", "")
                    row.setdefault("astrologicalReason", "")
                    row.setdefault("recommendedActions", [])

    return data
