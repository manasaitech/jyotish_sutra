# -*- coding: utf-8 -*-
"""
Document Understanding Layer — Converts raw chart_data into a structured
Document Intelligence style JSON object for the LLM.

This module is tab-agnostic. The same structured document is used regardless
of which section (health, career, finance, etc.) is being analyzed.

Architecture:
    chart_data + computed + profile → build_analysis_document() → structured dict
"""

from typing import Dict, List, Any, Optional
import datetime


def build_analysis_document(
    chart_data: dict,
    profile: dict = None,
    computed: dict = None,
    section_ids: list = None,
) -> dict:
    """
    Build the structured input document for the LLM.

    Converts raw chart_data, computed analyses, and profile into a clean,
    structured JSON document that the Structured Analysis Engine can consume.

    Returns:
        { "document": { "birthDetails": {...}, "planetaryPositions": [...], ... } }
    """
    profile = profile or {}
    computed = computed or {}
    chart_data = chart_data or {}

    # Precompute detailed dosha analysis for the doshas tab
    precomputed_doshas = None
    if section_ids and "doshas" in section_ids:
        try:
            from backend.astrology.dosha_reasoning import compute_doshas
            precomputed_doshas = compute_doshas(chart_data, computed)
        except Exception as d_err:
            print(f"[DocumentBuilder] Error precomputing doshas: {d_err}")

    document = {
        "birthDetails": _extract_birth_details(chart_data, profile),
        "planetaryPositions": _extract_planetary_positions(chart_data),
        "houses": _extract_houses(chart_data),
        "dashas": _extract_dashas(chart_data),
        "nakshatra": _extract_nakshatra(chart_data),
        "yogas": _extract_yogas(chart_data),
        "doshas": _extract_doshas(chart_data),
        "precomputed_dosha_analysis": precomputed_doshas,
        "prakriti": _extract_prakriti(computed),
        "metadata": _extract_metadata(chart_data, section_ids),
    }

    return {"document": document}


# ═══════════════════════════════════════════════════════════════
# EXTRACTION HELPERS
# ═══════════════════════════════════════════════════════════════

def _extract_birth_details(chart_data: dict, profile: dict) -> dict:
    """Extract birth details from profile and chart metadata."""
    meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}

    name = profile.get("name") or meta.get("name") or "Seeker"
    dob = (
        profile.get("date_of_birth") or profile.get("dateOfBirth") or
        meta.get("date_of_birth") or meta.get("birth_date") or
        chart_data.get("date_of_birth") or "Unknown"
    )
    tob = (
        profile.get("time_of_birth") or profile.get("timeOfBirth") or
        meta.get("time_of_birth") or chart_data.get("time_of_birth") or "Unknown"
    )
    pob = (
        profile.get("place_of_birth") or profile.get("placeOfBirth") or
        meta.get("place_of_birth") or "Unknown"
    )
    lat = profile.get("latitude") or meta.get("latitude") or chart_data.get("latitude")
    lon = profile.get("longitude") or meta.get("longitude") or chart_data.get("longitude")

    return {
        "name": str(name),
        "dateOfBirth": str(dob),
        "timeOfBirth": str(tob),
        "placeOfBirth": str(pob),
        "latitude": float(lat) if lat is not None else None,
        "longitude": float(lon) if lon is not None else None,
    }


def _extract_planetary_positions(chart_data: dict) -> list:
    """Convert the planets dict into a clean array of planetary position objects."""
    planets = chart_data.get("planets") or chart_data.get("raw_positions") or {}
    positions = []

    for planet_name, planet_data in planets.items():
        if not isinstance(planet_data, dict):
            continue

        positions.append({
            "planet": planet_name.capitalize(),
            "sign": planet_data.get("sign", "Unknown"),
            "house": planet_data.get("house"),
            "degree": round(planet_data.get("longitude", 0.0), 2),
            "isRetrograde": bool(planet_data.get("retrograde", False)),
            "isCombust": bool(planet_data.get("combust", False)),
            "nakshatra": planet_data.get("nakshatra"),
            "nakshatraPada": planet_data.get("pada"),
            "dignity": planet_data.get("dignity"),
        })

    return positions


def _extract_houses(chart_data: dict) -> list:
    """Convert the houses dict into a clean array of house objects."""
    houses_raw = chart_data.get("houses", {})
    planets = chart_data.get("planets") or chart_data.get("raw_positions") or {}
    houses = []

    for h_num in range(1, 13):
        h_key = str(h_num)
        h_data = houses_raw.get(h_key, {})

        if not isinstance(h_data, dict):
            continue

        # Find occupants
        occupants = [
            p_name.capitalize()
            for p_name, p_data in planets.items()
            if isinstance(p_data, dict) and str(p_data.get("house")) == h_key
        ]

        houses.append({
            "houseNumber": h_num,
            "sign": h_data.get("sign", "Unknown"),
            "lord": h_data.get("lord", "Unknown").capitalize() if h_data.get("lord") else "Unknown",
            "occupants": occupants,
        })

    return houses


def _extract_dashas(chart_data: dict) -> dict:
    """Extract active Mahadasha and Antardasha information."""
    try:
        from services.astrology.dasha import calculate_full_dasha_package
        from backend.utils.date_parser import parse_date_str

        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_long = moon_data.get("longitude", 120.0) if isinstance(moon_data, dict) else 120.0

        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        raw_dob = (
            meta.get("date_of_birth") or meta.get("birth_date") or meta.get("date_str") or
            chart_data.get("date_of_birth") or chart_data.get("birth_date") or
            chart_data.get("date_str") or "1998-05-15"
        )

        birth_dt = None
        try:
            birth_dt = parse_date_str(str(raw_dob))
        except Exception:
            try:
                birth_dt = datetime.date.fromisoformat(str(raw_dob)[:10])
            except Exception:
                birth_dt = datetime.date(1998, 5, 15)

        pkg = calculate_full_dasha_package(moon_long, birth_dt)
        curr_maha = pkg.get("current_mahadasha", {})
        curr_antar = pkg.get("current_antardasha", {})

        return {
            "currentMahadasha": {
                "planet": curr_maha.get("planet_name", "Unknown"),
                "startDate": curr_maha.get("start_date", "Unknown"),
                "endDate": curr_maha.get("end_date", "Unknown"),
            },
            "currentAntardasha": {
                "planet": curr_antar.get("planet_name", "Unknown") if curr_antar else "Unknown",
                "startDate": curr_antar.get("start_date", "Unknown") if curr_antar else "Unknown",
                "endDate": curr_antar.get("end_date", "Unknown") if curr_antar else "Unknown",
            },
        }
    except Exception as e:
        return {
            "currentMahadasha": {"planet": "Unknown", "startDate": "Unknown", "endDate": "Unknown"},
            "currentAntardasha": {"planet": "Unknown", "startDate": "Unknown", "endDate": "Unknown"},
            "error": str(e),
        }


def _extract_nakshatra(chart_data: dict) -> dict:
    """Extract nakshatra information from chart metadata."""
    meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}

    return {
        "name": meta.get("nakshatra") or chart_data.get("nakshatra") or "Unknown",
        "pada": meta.get("pada") or chart_data.get("pada") or 1,
        "lord": meta.get("nakshatra_lord") or "Unknown",
    }


def _extract_yogas(chart_data: dict) -> list:
    """Extract active yogas from chart data."""
    yogas_raw = chart_data.get("yogas", [])
    if not isinstance(yogas_raw, list):
        return []

    yogas = []
    for yoga in yogas_raw[:8]:  # Limit to top 8
        if isinstance(yoga, dict):
            yogas.append({
                "name": yoga.get("name", "Unknown"),
                "type": yoga.get("type", "Unknown"),
                "description": yoga.get("description", ""),
                "planets": yoga.get("planets", []),
            })

    return yogas


def _extract_doshas(chart_data: dict) -> list:
    """Extract active doshas from chart data."""
    doshas_raw = chart_data.get("doshas", {})
    if not isinstance(doshas_raw, dict):
        return []

    doshas = []
    for dosha_name, dosha_data in doshas_raw.items():
        if isinstance(dosha_data, dict):
            doshas.append({
                "name": dosha_name.capitalize(),
                "isPresent": bool(dosha_data.get("is_present", False)),
                "description": (dosha_data.get("description") or "")[:120],
                "severity": dosha_data.get("severity", "unknown"),
            })

    return doshas


def _extract_prakriti(computed: dict) -> dict:
    """Extract Ayurvedic Prakriti (Vata/Pitta/Kapha) from computed analyses."""
    prakriti = computed.get("prakriti", {})
    if not prakriti:
        return {"vata": None, "pitta": None, "kapha": None, "dominantDosha": None}

    return {
        "vata": prakriti.get("vata"),
        "pitta": prakriti.get("pitta"),
        "kapha": prakriti.get("kapha"),
        "dominantDosha": prakriti.get("dominant_dosha"),
    }


def _extract_metadata(chart_data: dict, section_ids: list = None) -> dict:
    """Extract chart metadata (ascendant, moon sign, etc.)."""
    meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}

    return {
        "ascendantSign": meta.get("ascendant_sign") or chart_data.get("ascendant_sign") or "Unknown",
        "moonSign": meta.get("moon_sign") or chart_data.get("moon_sign") or "Unknown",
        "ascendantDegree": meta.get("ascendant_longitude", 0.0),
        "chartMode": chart_data.get("mode", "exact"),
        "requestedSections": section_ids or [],
        "generatedAt": datetime.datetime.utcnow().isoformat() + "Z",
    }
