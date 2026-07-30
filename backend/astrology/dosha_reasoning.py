# -*- coding: utf-8 -*-
"""
Dosha Reasoning Engine (Layer 2) — Revisions for Fully Deterministic JSON UI.

Detects Vedic doshas, calculates metrics, and builds the raw API response structure directly.
No LLM markdown fallback calculations. Bypasses prompt synthesis.
"""

import datetime
from typing import Dict, List, Tuple, Optional, Any
from services.astrology.dasha import calculate_full_dasha_package

# ═══════════════════════════════════════════════════════════════
# ASPECT & CONJUNCTION COMPUTATION
# ═══════════════════════════════════════════════════════════════

def _get_aspected_houses(planet_name: str, planet_house: int) -> set:
    """Return set of house numbers (1-12) aspected by this planet (Vedic Drishti)."""
    if not planet_house:
        return set()
    h = int(planet_house)
    aspected = set()

    aspected.add(((h - 1 + 6) % 12) + 1)

    p = planet_name.lower()
    if p == "mars":
        aspected.add(((h - 1 + 3) % 12) + 1)   # 4th
        aspected.add(((h - 1 + 7) % 12) + 1)   # 8th
    elif p == "jupiter":
        aspected.add(((h - 1 + 4) % 12) + 1)   # 5th
        aspected.add(((h - 1 + 8) % 12) + 1)   # 9th
    elif p == "saturn":
        aspected.add(((h - 1 + 2) % 12) + 1)   # 3rd
        aspected.add(((h - 1 + 9) % 12) + 1)   # 10th

    return aspected


def _build_aspect_map(planets: dict) -> Dict[int, List[str]]:
    """Build mapping: house_number → [planets aspecting that house]."""
    aspect_map = {h: [] for h in range(1, 13)}
    for p_name, p_data in planets.items():
        if not isinstance(p_data, dict):
            continue
        h = p_data.get("house")
        if not h:
            continue
        for target_house in _get_aspected_houses(p_name, int(h)):
            aspect_map[target_house].append(p_name)
    return aspect_map


def _build_conjunction_map(planets: dict) -> Dict[str, List[str]]:
    """Build mapping: planet_name → [planets sharing same house]."""
    house_groups: Dict[int, List[str]] = {}
    for p_name, p_data in planets.items():
        if not isinstance(p_data, dict):
            continue
        h = p_data.get("house")
        if h:
            house_groups.setdefault(int(h), []).append(p_name)

    conjunctions: Dict[str, List[str]] = {}
    for h, group in house_groups.items():
        for p in group:
            conjunctions[p] = [other for other in group if other != p]
    return conjunctions


# ═══════════════════════════════════════════════════════════════
# DOSHA EVIDENCE DATA OBJECT
# ═══════════════════════════════════════════════════════════════

class DoshaEvidence:
    def __init__(
        self,
        name: str,
        detected: bool,
        formation_strength: int,
        confidence: str,
        status: str,
        practical_impact: str,
        why_exists: List[str],
        positive_traits: List[str],
        challenges: List[str],
        protective_factors: List[str],
        aggravating_factors: List[str],
        timeline: Dict[str, str],
        remedies: Dict[str, List[str]],
        life_areas_affected: Dict[str, str],
        mitigation_status: str  # Kept internal for logic checks
    ):
        self.name = name
        self.detected = detected
        self.formation_strength = formation_strength
        self.confidence = confidence
        self.status = status
        self.practical_impact = practical_impact
        self.why_exists = why_exists
        self.positive_traits = positive_traits
        self.challenges = challenges
        self.protective_factors = protective_factors
        self.aggravating_factors = aggravating_factors
        self.timeline = timeline
        self.remedies = remedies
        self.life_areas_affected = life_areas_affected
        self.mitigation_status = mitigation_status

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "formation_strength": self.formation_strength,
            "confidence": self.confidence,
            "status": self.status,
            "practical_impact": self.practical_impact,
            "why_exists": self.why_exists,
            "positive_traits": self.positive_traits,
            "challenges": self.challenges,
            "protective_factors": self.protective_factors,
            "aggravating_factors": self.aggravating_factors,
            "timeline": self.timeline,
            "remedies": self.remedies
        }


# ═══════════════════════════════════════════════════════════════
# HELPER FOR TIMELINE DICTIONARY
# ═══════════════════════════════════════════════════════════════

def _calculate_timeline_dict(planets_involved: List[str], dasha_package: Optional[dict], current_influence: str) -> Dict[str, str]:
    """Calculate the visual timeline keys for each dosha."""
    current_year = datetime.date.today().year
    
    current_status = "Dormant"
    if current_influence in ["High", "Very High"]:
        current_status = "Active"
    elif current_influence == "Moderate":
        current_status = "Emerging"

    next_activation = "None"
    estimated_period = "Lifetime"

    if not dasha_package or not planets_involved:
        return {
            "current": current_status,
            "next_activation": next_activation,
            "estimated_period": estimated_period
        }

    involved_lower = [p.lower() for p in planets_involved]
    timeline = dasha_package.get("timeline", [])

    for item in timeline:
        lord = item["planet"].lower()
        if lord in involved_lower:
            start_year = int(item["start_date"][:4])
            end_year = int(item["end_date"][:4])
            
            if start_year > current_year:
                next_activation = f"{item['planet'].capitalize()} Mahadasha"
                estimated_period = f"{start_year}–{end_year}"
                break
            elif start_year <= current_year <= end_year:
                next_activation = "Current Dasha Period"
                estimated_period = f"{start_year}–{end_year}"
                break

    return {
        "current": current_status,
        "next_activation": next_activation,
        "estimated_period": estimated_period
    }


# ═══════════════════════════════════════════════════════════════
# DETECTOR FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def check_manglik_dosha(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    mars = planets.get("mars")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"
    
    if isinstance(mars, dict):
        h = int(mars.get("house", 0))
        if h in [1, 2, 4, 7, 8, 12]:
            detected = True
            why_exists.append(f"Mars occupies the {h} house from Lagna (Ascendant).")
            
            if h in [7, 8]:
                formation_strength = 5
                why_exists.append("Mars occupies a critical relationship house (7th/8th house).")
                aggravating_factors.append("Mars occupies relationship house (7th/8th) which intensifies friction.")
            else:
                formation_strength = 3
                
            why_exists.append(f"Mars aspects the {((h - 1 + 6) % 12) + 1} house.")
            
            dig = (mars.get("dignity") or "neutral").lower()
            if "exalted" in dig:
                formation_strength -= 1
                protective_factors.append("Mars is exalted, adding logical control to passion.")
            elif "own" in dig:
                formation_strength -= 1
                protective_factors.append(f"Mars occupies its own sign ({mars.get('sign')}).")
            elif "debilitated" in dig:
                formation_strength += 1
                why_exists.append("Mars is debilitated, causing erratic patterns in anger management.")
                aggravating_factors.append("Debilitation of Mars increases impulsive emotional reactions.")
                
            jupiter_aspects = "jupiter" in aspect_map.get(h, [])
            if jupiter_aspects:
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects Mars, wrapping martial heat in wisdom.")
            else:
                mitigation_status = "Weak"
                
            sign = (mars.get("sign") or "").lower()
            if (h == 1 and sign == "aries") or (h == 4 and sign == "scorpio") or (h == 7 and sign == "capricorn") or (h == 8 and sign == "sagittarius") or (h == 12 and sign == "taurus"):
                protective_factors.append(f"Mars is in {mars.get('sign')}, Cancels severe classical dosha expressions.")
                mitigation_status = "Strong"

            mahadasha_active = False
            antardasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                curr_antar = dasha_package.get("current_antardasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() == "mars"
                antardasha_active = (curr_antar.get("planet") or "").lower() == "mars" if curr_antar else False

            if mahadasha_active:
                current_influence = "Very High"
            elif antardasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Mars is not the current Mahadasha lord.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate" if formation_strength >= 4 else "Minimal"
            elif mitigation_status == "Moderate":
                overall_impact = "Moderate" if formation_strength >= 4 else "Low–Moderate"
            else:
                overall_impact = "Significant" if formation_strength >= 4 else "Moderate"

            if overall_impact in ["Minimal", "Low–Moderate"] and not (mahadasha_active or antardasha_active):
                practical_impact = "Minimal"
            elif overall_impact == "Significant" or (mahadasha_active or antardasha_active):
                practical_impact = "Significant"
            else:
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Mars"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Manglik Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="High" if (formation_strength >= 4 and detected) else "Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Courage", "Leadership", "Strong determination", "Decisiveness"],
        challenges=["Relationship conflicts", "Impulsive decisions", "Anger issues"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Recite Hanuman Chalisa daily", "Donate red lentils on Tuesdays"],
            "lifestyle": ["Heavy physical workouts to release stress", "Practice conscious breathing before key talks"],
            "practical": ["Engage in honest compatibility mapping before deals", "Communication training focusing on collaborative tone"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "High" if formation_strength >= 4 else "Moderate",
            "finance": "Minimal",
            "health": "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_partial_manglik(planets: dict, aspect_map: dict, is_manglik: bool, dasha_package: Optional[dict]) -> DoshaEvidence:
    mars = planets.get("mars")
    moon = planets.get("moon")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if not is_manglik and isinstance(mars, dict) and isinstance(moon, dict):
        h_mars = int(mars.get("house", 0))
        h_moon = int(moon.get("house", 0))
        diff_house = ((h_mars - h_moon) % 12) + 1
        
        if diff_house in [1, 2, 4, 7, 8, 12]:
            detected = True
            why_exists.append(f"Mars is in the {diff_house} house relative to the Moon (Chandra Lagna).")
            formation_strength = 2
            
            jupiter_aspects = "jupiter" in aspect_map.get(h_mars, [])
            if jupiter_aspects:
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects Mars, buffering emotional friction.")
            else:
                mitigation_status = "Moderate"
                
            dig = (mars.get("dignity") or "neutral").lower()
            if "exalted" in dig or "own" in dig:
                protective_factors.append("Mars occupies a strong dignity sign, promoting mental control.")
                mitigation_status = "Strong"

            mahadasha_active = False
            antardasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                curr_antar = dasha_package.get("current_antardasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() == "mars"
                antardasha_active = (curr_antar.get("planet") or "").lower() == "mars" if curr_antar else False

            if mahadasha_active or antardasha_active:
                current_influence = "Moderate"
            else:
                current_influence = "Low"
                protective_factors.append("Mars is not currently active in Mahadasha cycles.")

            overall_impact = "Low–Moderate" if mitigation_status != "Strong" else "Minimal"
            practical_impact = "Minimal" if current_influence == "Low" else "Moderate"

    timeline_dict = _calculate_timeline_dict(["Mars", "Moon"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Partial Manglik",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Emotional determination", "Strong drive to protect family", "Innate survival instincts"],
        challenges=["Friction in family life", "Erratic energy patterns", "Defensive emotional stance"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Chant 'Om Mangalaya Namaha' on Tuesdays", "Donate sweet items to family"],
            "lifestyle": ["Calming meditation and yoga", "Engage in creative hobbies to filter stress"],
            "practical": ["Schedule open talks with family about minor issues", "Adopt shared financial targets"]
        },
        life_areas_affected={
            "career": "Minimal",
            "marriage": "Moderate",
            "finance": "None",
            "health": "Low",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_kaal_sarp(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    rahu = planets.get("rahu")
    ketu = planets.get("ketu")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(rahu, dict) and isinstance(ketu, dict):
        h_r = int(rahu.get("house", 0))
        h_k = int(ketu.get("house", 0))
        
        if h_r and h_k:
            traditional = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]
            lons = []
            for p in traditional:
                pd = planets.get(p)
                if isinstance(pd, dict):
                    lons.append((p, float(pd.get("longitude", 0.0))))

            r_lon = float(rahu.get("longitude", 0.0))
            k_lon = float(ketu.get("longitude", 0.0))
            min_lon = min(r_lon, k_lon)
            max_lon = max(r_lon, k_lon)
            
            inside = 0
            outside = 0
            for name, lon in lons:
                if min_lon <= lon <= max_lon:
                    inside += 1
                else:
                    outside += 1
                    
            if inside == 7 or outside == 7:
                detected = True
                why_exists.append("All traditional planets are hemmed on one side of Rahu-Ketu axis.")
                formation_strength = 4
                
                if h_r == 1:
                    formation_strength = 5
                    why_exists.append("Rahu is in the 1st house (Anant Kaal Sarp).")
                    aggravating_factors.append("Rahu in Lagna intensifies personal identity struggles.")
                elif h_r == 8:
                    formation_strength = 5
                    why_exists.append("Rahu is in the 8th house (Karkotak Kaal Sarp).")
                    aggravating_factors.append("Rahu in the 8th house aggravates sudden changes.")
                
                j_asp_r = "jupiter" in aspect_map.get(h_r, [])
                j_asp_k = "jupiter" in aspect_map.get(h_k, [])
                if j_asp_r or j_asp_k:
                    mitigation_status = "Strong"
                    protective_factors.append("Jupiter aspects the Rahu-Ketu axis, softening karmic changes.")
                else:
                    mitigation_status = "None"
                    protective_factors.append("Rahu-Ketu axis receives no direct benefic aspects.")

                mahadasha_active = False
                antardasha_active = False
                
                if dasha_package:
                    curr_maha = dasha_package.get("current_mahadasha", {})
                    curr_antar = dasha_package.get("current_antardasha", {})
                    mahadasha_active = (curr_maha.get("planet") or "").lower() in ["rahu", "ketu"]
                    antardasha_active = (curr_antar.get("planet") or "").lower() in ["rahu", "ketu"] if curr_antar else False

                if mahadasha_active:
                    current_influence = "Very High"
                elif antardasha_active:
                    current_influence = "High"
                else:
                    current_influence = "Low"
                    protective_factors.append("Running Dasha is not ruled by Rahu or Ketu.")

                if mitigation_status == "Strong":
                    overall_impact = "Low–Moderate"
                else:
                    overall_impact = "Significant" if formation_strength >= 5 else "Moderate"

                if overall_impact == "Significant" or mahadasha_active:
                    practical_impact = "Significant"
                elif overall_impact == "Low–Moderate" and not (mahadasha_active or antardasha_active):
                    practical_impact = "Minimal"
                else:
                    practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Rahu", "Ketu"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Kaal Sarp Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="High" if detected else "Low",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Extreme resilience", "Highly unconventional thinking", "Unique success in later years"],
        challenges=["Sudden changes in direction", "Heavy struggles in early life", "Frequent delays in projects"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Chant Maha Mrityunjaya Mantra on Mondays", "Donate black wool during eclipses"],
            "lifestyle": ["Worship Lord Shiva daily", "Ensure clean surroundings to ground mental confusion"],
            "practical": ["Avoid speculative deals without counsel", "Keep document backups and legal contracts in order"]
        },
        life_areas_affected={
            "career": "High" if formation_strength >= 5 else "Moderate",
            "marriage": "Low",
            "finance": "Moderate",
            "health": "Low",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_pitra_dosha(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    sun = planets.get("sun")
    rahu = planets.get("rahu")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    h9_occ = []
    for p in ["rahu", "ketu"]:
        pd = planets.get(p)
        if isinstance(pd, dict) and int(pd.get("house", 0)) == 9:
            h9_occ.append(p)
            
    sun_in_9 = False
    if isinstance(sun, dict) and int(sun.get("house", 0)) == 9:
        sun_in_9 = True

    if h9_occ or (sun_in_9 and any(isinstance(planets.get(m), dict) and int(planets[m].get("house", 0)) == 9 for m in ["rahu", "ketu", "saturn"])):
        detected = True
        why_exists.append("The 9th house (Dharma/Ancestors) is occupied by lunar nodes.")
        formation_strength = 3
        
        if sun_in_9 and "rahu" in h9_occ:
            formation_strength = 5
            why_exists.append("Sun is conjunct Rahu in the 9th house.")
            aggravating_factors.append("Conjunction of Sun and Rahu eclipses authority and father relations.")
            
        j_asp = "jupiter" in aspect_map.get(9, [])
        if j_asp:
            mitigation_status = "Strong"
            protective_factors.append("Jupiter aspects the 9th house, protecting lineage karma.")
        else:
            mitigation_status = "Weak"

        mahadasha_active = False
        antardasha_active = False
        
        if dasha_package:
            curr_maha = dasha_package.get("current_mahadasha", {})
            curr_antar = dasha_package.get("current_antardasha", {})
            mahadasha_active = (curr_maha.get("planet") or "").lower() in ["sun", "rahu"]
            antardasha_active = (curr_antar.get("planet") or "").lower() in ["sun", "rahu"] if curr_antar else False

        if mahadasha_active or antardasha_active:
            current_influence = "Moderate"
        else:
            current_influence = "Low"
            protective_factors.append("Running Dasha is not ruled by Sun or Rahu.")

        if mitigation_status == "Strong":
            overall_impact = "Low–Moderate"
            practical_impact = "Minimal"
        else:
            overall_impact = "Moderate"
            practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Sun", "Rahu"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Pitra Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Lineage respect", "Linage duties responsibility", "Administrative skill inheritance"],
        challenges=["Delays in titles", "Elderly responsibilities feel heavy", "Luck blockages"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Feed street crows on Saturdays", "Offer clean water to the Sun"],
            "lifestyle": ["Treat elderly with respect", "Document family history"],
            "practical": ["Proactively monitor parental health", "Keep deeds and legal titles in order"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Low",
            "health": "None",
            "children": "Minimal"
        },
        mitigation_status=mitigation_status
    )


def check_shrapit_dosha(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    saturn = planets.get("saturn")
    rahu = planets.get("rahu")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(saturn, dict) and isinstance(rahu, dict):
        h_s = int(saturn.get("house", 0))
        h_r = int(rahu.get("house", 0))
        
        if h_s == h_r and h_s > 0:
            detected = True
            why_exists.append(f"Saturn and Rahu are conjunct in house {h_s}.")
            formation_strength = 4
            
            s_deg = float(saturn.get("longitude", 0.0))
            r_deg = float(rahu.get("longitude", 0.0))
            if abs(s_deg - r_deg) < 8.0:
                formation_strength = 5
                why_exists.append("Saturn-Rahu conjunction is within a tight 8-degree orb.")
                aggravating_factors.append("Tight orb of Saturn-Rahu conjunction intensifies karmic blocks.")
                
            if "jupiter" in aspect_map.get(h_s, []):
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects Saturn-Rahu, neutralizing harsh results.")
            else:
                mitigation_status = "Weak"

            mahadasha_active = False
            antardasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                curr_antar = dasha_package.get("current_antardasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() in ["saturn", "rahu"]
                antardasha_active = (curr_antar.get("planet") or "").lower() in ["saturn", "rahu"] if curr_antar else False

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Saturn/Rahu not active in major Dasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Significant" if formation_strength >= 5 else "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Saturn", "Rahu"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Shrapit Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="High" if detected else "Low",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Deep resilience", "Discipline", "Systematic planning", "Long-term stamina"],
        challenges=["Friction in professional goals", "Project delays", "Sudden roadblocks"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Light Peepal lamp on Saturdays", "Donate blue items"],
            "lifestyle": ["Practice systematic patience", "Regular joint exercises"],
            "practical": ["Allow 20% buffer for milestones", "Verify legal paperwork before deals"]
        },
        life_areas_affected={
            "career": "High" if formation_strength >= 5 else "Moderate",
            "marriage": "Low",
            "finance": "Low",
            "health": "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_surya_grahan(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    sun = planets.get("sun")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(sun, dict):
        h_s = int(sun.get("house", 0))
        node_conj = None
        for node in ["rahu", "ketu"]:
            nd = planets.get(node)
            if isinstance(nd, dict) and int(nd.get("house", 0)) == h_s:
                node_conj = node
                break
                
        if node_conj and h_s > 0:
            detected = True
            why_exists.append(f"Sun is conjunct {node_conj.capitalize()} in house {h_s}.")
            formation_strength = 3
            
            s_deg = float(sun.get("longitude", 0.0))
            n_deg = float(planets[node_conj].get("longitude", 0.0))
            if abs(s_deg - n_deg) < 8.0:
                formation_strength = 4
                why_exists.append("Conjunction is within tight orb (< 8 degrees).")
                aggravating_factors.append("Tight orb eclipses solar identity.")
                
            if "jupiter" in aspect_map.get(h_s, []):
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects the Sun, restoring confidence.")
            else:
                mitigation_status = "Weak"

            mahadasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() in ["sun", node_conj]

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Sun/Nodes are not in active Mahadasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Sun"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Surya Grahan Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Capacity for self-analysis", "Independent leadership views", "Unique personal path"],
        challenges=["Occasional shifts in confidence", "Friction with authority", "Paternal health issues"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Recite Aditya Hrudaya Stotram on Sundays", "Donate copper items"],
            "lifestyle": ["Spend time in morning sunlight", "Regular cardio exercise"],
            "practical": ["Perform wellness checks", "Set clear boundary rules with supervisors"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Low",
            "health": "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_chandra_grahan(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    moon = planets.get("moon")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(moon, dict):
        h_m = int(moon.get("house", 0))
        node_conj = None
        for node in ["rahu", "ketu"]:
            nd = planets.get(node)
            if isinstance(nd, dict) and int(nd.get("house", 0)) == h_m:
                node_conj = node
                break
                
        if node_conj and h_m > 0:
            detected = True
            why_exists.append(f"Moon is conjunct {node_conj.capitalize()} in house {h_m}.")
            formation_strength = 3
            
            m_deg = float(moon.get("longitude", 0.0))
            n_deg = float(planets[node_conj].get("longitude", 0.0))
            if abs(m_deg - n_deg) < 8.0:
                formation_strength = 4
                why_exists.append("Conjunction is within tight orb (< 8 degrees).")
                aggravating_factors.append("Tight orb of node conjunction eclipses emotional clarity.")
                
            if "jupiter" in aspect_map.get(h_m, []):
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects the Moon, neutralizing fluctuations.")
            else:
                mitigation_status = "Weak"

            mahadasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() in ["moon", node_conj]

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Moon/Nodes are not in active Mahadasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Moon"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Chandra Grahan Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Highly intuitive mind", "Empathetic listening skills", "Deep psychological understanding"],
        challenges=["Mood swings", "High sensitivity to negative atmospheres", "Sleep quality issues"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Chant Moon Mantras on Mondays", "Donate white rice on Mondays"],
            "lifestyle": ["Calming bedroom setup", "Journaling to release worries"],
            "practical": ["Consult trusted mentors", "Set boundaries for stress absorption"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "Moderate",
            "finance": "Low",
            "health": "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_guru_chandal(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    jupiter = planets.get("jupiter")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(jupiter, dict):
        h_j = int(jupiter.get("house", 0))
        node_conj = None
        for node in ["rahu", "ketu"]:
            nd = planets.get(node)
            if isinstance(nd, dict) and int(nd.get("house", 0)) == h_j:
                node_conj = node
                break
                
        if node_conj and h_j > 0:
            detected = True
            why_exists.append(f"Jupiter is conjunct {node_conj.capitalize()} in house {h_j}.")
            
            dig = (jupiter.get("dignity") or "neutral").lower()
            if "exalted" in dig or "own" in dig:
                formation_strength = 2
                protective_factors.append("Jupiter is strong in its own/exalted sign, reducing afflictions.")
                mitigation_status = "Strong"
            else:
                formation_strength = 4
                mitigation_status = "Weak"
                
            if h_j in [6, 8, 12]:
                formation_strength += 1
                why_exists.append(f"Conjunction is placed in Dusthana house ({h_j} house).")
                aggravating_factors.append("Placement of conjunction in Dusthana house aggravates judgment issues.")

            mahadasha_active = False
            
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() in ["jupiter", node_conj]

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Jupiter/Nodes are not in active Mahadasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Jupiter", "Rahu"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Guru Chandal Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="High" if detected else "Low",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Innovation", "Independent learning", "Original ideas", "Unconventional wisdom"],
        challenges=["Judgment issues", "Unconventional beliefs cause arguments", "Rebellion against traditions"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Donate yellow books on Thursdays", "Chant 'Om Guruve Namaha'"],
            "lifestyle": ["Adopt logical checkpoint systems", "Balanced diet for liver health"],
            "practical": ["Consult mentors for logic checks", "Verify deals legally before signing"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Moderate",
            "health": "None",
            "children": "Minimal"
        },
        mitigation_status=mitigation_status
    )


def check_kemadruma(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    moon = planets.get("moon")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(moon, dict):
        h_m = int(moon.get("house", 0))
        if h_m > 0:
            h_prev = 12 if h_m == 1 else h_m - 1
            h_next = 1 if h_m == 12 else h_m + 1
            
            planets_in_adjacent = False
            for name, pd in planets.items():
                if name in ["sun", "rahu", "ketu", "moon"]:
                    continue
                if isinstance(pd, dict):
                    h_p = int(pd.get("house", 0))
                    if h_p in [h_prev, h_next]:
                        planets_in_adjacent = True
                        break
            
            kendra_occupied = False
            for name, pd in planets.items():
                if name in ["sun", "rahu", "ketu", "moon"]:
                    continue
                if isinstance(pd, dict):
                    h_p = int(pd.get("house", 0))
                    if h_p in [1, 4, 7, 10]:
                        kendra_occupied = True
                        break
                        
            if not planets_in_adjacent:
                detected = True
                why_exists.append("No planets (except Sun/Nodes) occupy 2nd and 12th houses from Moon.")
                formation_strength = 4
                
                if kendra_occupied:
                    mitigation_status = "Strong"
                    protective_factors.append("Kendra houses contain planets, cancelling classical isolation.")
                
                j_asp = "jupiter" in aspect_map.get(h_m, [])
                v_asp = "venus" in aspect_map.get(h_m, [])
                if j_asp or v_asp:
                    mitigation_status = "Strong"
                    protective_factors.append("Moon receives aspect from Jupiter/Venus, giving mental strength.")

                mahadasha_active = False
                if dasha_package:
                    curr_maha = dasha_package.get("current_mahadasha", {})
                    mahadasha_active = (curr_maha.get("planet") or "").lower() == "moon"

                if mahadasha_active:
                    current_influence = "Moderate"
                else:
                    current_influence = "Low"
                    protective_factors.append("Moon is not in active Mahadasha cycles.")

                if mitigation_status == "Strong":
                    overall_impact = "Low–Moderate"
                    practical_impact = "Minimal"
                else:
                    overall_impact = "Moderate"
                    practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Moon"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Kemadruma Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["High self-reliance", "Independent emotional structure", "Deep focus on personal goals"],
        challenges=["Feelings of isolation", "Unpredictable savings patterns", "Lack of support"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Pray to Goddess Lakshmi", "Chant Shiva Mantras on Mondays"],
            "lifestyle": ["Avoid total isolation", "Maintain emotional journals"],
            "practical": ["Automate savings to check spending", "Seek counsel when overwhelmed"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "Low",
            "finance": "Moderate",
            "health": "Minimal",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_chandra_dosha(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    moon = planets.get("moon")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(moon, dict):
        h = int(moon.get("house", 0))
        dig = (moon.get("dignity") or "neutral").lower()
        is_combust = bool(moon.get("combust"))
        
        afflicted = False
        if h in [6, 8, 12]:
            afflicted = True
            why_exists.append(f"Moon is placed in a Dusthana house ({h} house).")
        if "debilitated" in dig:
            afflicted = True
            why_exists.append("Moon is debilitated in Scorpio.")
            aggravating_factors.append("Moon debility increases emotional vulnerability.")
        if is_combust:
            afflicted = True
            why_exists.append("Moon is combust.")
            aggravating_factors.append("Combustion of Moon limits clear thought processes.")
            
        s_h = int(planets.get("saturn", {}).get("house", 0))
        if s_h == h or "saturn" in aspect_map.get(h, []):
            afflicted = True
            why_exists.append("Moon is afflicted by Saturn aspect/conjunction.")
            aggravating_factors.append("Saturn pressure adds melancholic thoughts.")

        if afflicted:
            detected = True
            formation_strength = 3
            
            if "jupiter" in aspect_map.get(h, []):
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects the Moon, calming emotional friction.")
            else:
                mitigation_status = "Weak"

            mahadasha_active = False
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() == "moon"

            if mahadasha_active:
                current_influence = "Moderate"
            else:
                current_influence = "Low"
                protective_factors.append("Moon is not in active Mahadasha cycles.")

            overall_impact = "Low–Moderate" if mitigation_status == "Strong" else "Moderate"
            practical_impact = "Minimal" if current_influence == "Low" else "Moderate"

    timeline_dict = _calculate_timeline_dict(["Moon"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Chandra Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Intuitive mindset", "Empathetic listening", "Deep safety concern"],
        challenges=["Mood swings", "Anxiety", "Environmental stress affects sleep"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Recite Chandra Mantras on Mondays", "Donate rice on Mondays"],
            "lifestyle": ["Calming sleep routine", "Practice deep breathing exercises"],
            "practical": ["Set emotional boundaries", "Preventative diagnostics checkups"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "Moderate",
            "finance": "Low",
            "health": "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_daridra_dosha(planets: dict, houses_lord: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    h2 = houses_lord.get(2)
    h11 = houses_lord.get(11)
    
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"
    
    lords_involved = []
    if h2: lords_involved.append((2, h2.lower()))
    if h11: lords_involved.append((11, h11.lower()))

    afflicted_lords = []
    for h_num, lord in lords_involved:
        ld = planets.get(lord)
        if isinstance(ld, dict):
            h_lord = int(ld.get("house", 0))
            if h_lord in [6, 8, 12]:
                afflicted_lords.append(lord)
                why_exists.append(f"Lord of the {h_num} house ({lord.capitalize()}) is in house {h_lord}.")

    if afflicted_lords:
        detected = True
        formation_strength = 3
        
        if len(afflicted_lords) > 1:
            formation_strength = 4
            why_exists.append("Both wealth and gains lords occupy Dusthana houses.")
            aggravating_factors.append("Debility of multiple wealth lords restricts rapid expansion.")
            
        mitigation_found = False
        for h_num, lord in lords_involved:
            ld = planets.get(lord)
            if isinstance(ld, dict):
                h_lord = int(ld.get("house", 0))
                if "jupiter" in aspect_map.get(h_lord, []) or "venus" in aspect_map.get(h_lord, []):
                    mitigation_status = "Strong"
                    protective_factors.append(f"Lord {lord.capitalize()} is aspected by benefic planet.")
                    mitigation_found = True
                    break
        if not mitigation_found:
            mitigation_status = "Weak"

        mahadasha_active = False
        if dasha_package:
            curr_maha = dasha_package.get("current_mahadasha", {})
            mahadasha_active = (curr_maha.get("planet") or "").lower() in [lord for h_num, lord in lords_involved]

        if mahadasha_active:
            current_influence = "High"
        else:
            current_influence = "Low"
            protective_factors.append("Wealth lords are not active in major Mahadasha cycles.")

        if mitigation_status == "Strong":
            overall_impact = "Low–Moderate"
            practical_impact = "Minimal"
        else:
            overall_impact = "Moderate"
            practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict([lord for h_num, lord in lords_involved], dasha_package, current_influence)

    return DoshaEvidence(
        name="Daridra Dosha",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Ethical values focus", "Diligence builds money habits", "Capacity to manage large systems"],
        challenges=["Friction in cash accumulation", "Sudden expenses drain savings", "Lack of capital support"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Chant Kanakadhara Stotram", "Donate yellow grains"],
            "lifestyle": ["Strict financial budgeting", "Maintain simple living standards"],
            "practical": ["Set aside automated savings", "Consult financial advisors before investments"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "Minimal",
            "finance": "High" if formation_strength >= 4 else "Moderate",
            "health": "None",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_sarpa_influence(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    rahu = planets.get("rahu")
    ketu = planets.get("ketu")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(rahu, dict) and isinstance(ketu, dict):
        h_r = int(rahu.get("house", 0))
        h_k = int(ketu.get("house", 0))
        
        if h_r == 5 or h_k == 5:
            detected = True
            why_exists.append("The 5th house is occupied by Rahu or Ketu.")
            formation_strength = 3
            
            if "mars" in aspect_map.get(5, []) or "saturn" in aspect_map.get(5, []):
                formation_strength = 4
                why_exists.append("5th house receives aspectual pressure from Mars or Saturn.")
                aggravating_factors.append("Malefic aspects on 5th house increase pressure.")
                
            if "jupiter" in aspect_map.get(5, []):
                mitigation_status = "Strong"
                protective_factors.append("Jupiter aspects the 5th house, protecting intelligence.")
            else:
                mitigation_status = "Weak"

            mahadasha_active = False
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() in ["rahu", "ketu"]

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Rahu/Ketu not active in major Dasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Rahu", "Ketu"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Sarpa Influence",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Highly analytical mind", "Original research capabilities", "Unique out-of-box thinking"],
        challenges=["Concentration blocks", "Mental stress or confusion", "Friction with juniors"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Chant Rahu Mantras", "Pray to Lord Shiva"],
            "lifestyle": ["Focus on gut health", "Calming meditation to build focus"],
            "practical": ["Document educational achievements", "Set small milestone checkpoints"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "None",
            "finance": "Low",
            "health": "Low",
            "children": "High" if formation_strength >= 4 else "Moderate"
        },
        mitigation_status=mitigation_status
    )


def check_afflicted_sixth_house(planets: dict, houses_lord: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    lord = houses_lord.get(6)
    if lord:
        ld = planets.get(lord.lower())
        if isinstance(ld, dict):
            h_lord = int(ld.get("house", 0))
            dig = (ld.get("dignity") or "neutral").lower()
            is_combust = bool(ld.get("combust"))
            
            if h_lord in [8, 12] or "debilitated" in dig or is_combust:
                detected = True
                why_exists.append(f"The 6th house lord ({lord.capitalize()}) is in house {h_lord}.")
                formation_strength = 3
                
                if is_combust:
                    formation_strength = 4
                    why_exists.append(f"6th lord ({lord.capitalize()}) is combust.")
                    aggravating_factors.append("Lord combustion weakens defense patterns.")
                    
                if "jupiter" in aspect_map.get(6, []) or "jupiter" in aspect_map.get(h_lord, []):
                    mitigation_status = "Strong"
                    protective_factors.append("Jupiter aspects 6th house or lord, shielding health.")
                else:
                    mitigation_status = "Weak"

                mahadasha_active = False
                if dasha_package:
                    curr_maha = dasha_package.get("current_mahadasha", {})
                    mahadasha_active = (curr_maha.get("planet") or "").lower() == lord.lower()

                if mahadasha_active:
                    current_influence = "High"
                else:
                    current_influence = "Low"
                    protective_factors.append("6th lord not active in major Mahadasha cycles.")

                if mitigation_status == "Strong":
                    overall_impact = "Low–Moderate"
                    practical_impact = "Minimal"
                else:
                    overall_impact = "Moderate"
                    practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict([lord] if lord else [], dasha_package, current_influence)

    return DoshaEvidence(
        name="Afflicted Sixth House",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Strong service mindset", "Strategic conflict resolution", "Detailed operational skills"],
        challenges=["Systemic health sensitivities", "Friction with daily workflow", "Roadblocks with minor debts"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Recite Hanuman Mantras", "Worship Lord Kartikeya"],
            "lifestyle": ["Daily regular routine (Dinacharya)", "Light cardio exercise"],
            "practical": ["Preventative health diagnostics", "Document transaction details"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Low",
            "health": "High" if formation_strength >= 4 else "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_afflicted_eighth_house(planets: dict, houses_lord: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    lord = houses_lord.get(8)
    if lord:
        ld = planets.get(lord.lower())
        if isinstance(ld, dict):
            h_lord = int(ld.get("house", 0))
            dig = (ld.get("dignity") or "neutral").lower()
            is_combust = bool(ld.get("combust"))
            
            if h_lord in [6, 12] or "debilitated" in dig or is_combust:
                detected = True
                why_exists.append(f"The 8th house lord ({lord.capitalize()}) is in house {h_lord}.")
                formation_strength = 3
                
                if "debilitated" in dig:
                    formation_strength = 4
                    why_exists.append(f"8th lord ({lord.capitalize()}) is debilitated.")
                    aggravating_factors.append("Lord debility weakens life force dynamics.")
                    
                if "jupiter" in aspect_map.get(8, []) or "jupiter" in aspect_map.get(h_lord, []):
                    mitigation_status = "Strong"
                    protective_factors.append("Jupiter aspects 8th house or lord, protecting longevity.")
                else:
                    mitigation_status = "Weak"

                mahadasha_active = False
                if dasha_package:
                    curr_maha = dasha_package.get("current_mahadasha", {})
                    mahadasha_active = (curr_maha.get("planet") or "").lower() == lord.lower()

                if mahadasha_active:
                    current_influence = "High"
                else:
                    current_influence = "Low"
                    protective_factors.append("8th lord not active in major Mahadasha cycles.")

                if mitigation_status == "Strong":
                    overall_impact = "Low–Moderate"
                    practical_impact = "Minimal"
                else:
                    overall_impact = "Moderate"
                    practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict([lord] if lord else [], dasha_package, current_influence)

    return DoshaEvidence(
        name="Afflicted Eighth House",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Deep research capabilities", "Ability to handle sudden changes", "Joint financial structures capacity"],
        challenges=["Sudden changes in life setups", "Legacy wealth friction", "Occasional health transitions"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Pray to Lord Shiva", "Donate black oil on Saturdays"],
            "lifestyle": ["Avoid high-risk sports", "Practice meditation for mental calm"],
            "practical": ["Asset and health insurance", "Keep legal documentation updated"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Moderate",
            "health": "High" if formation_strength >= 4 else "Moderate",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_guru_affliction(planets: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    jupiter = planets.get("jupiter")
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    if isinstance(jupiter, dict):
        h = int(jupiter.get("house", 0))
        dig = (jupiter.get("dignity") or "neutral").lower()
        is_combust = bool(jupiter.get("combust"))
        
        afflicted = False
        if h in [6, 8, 12]:
            afflicted = True
            why_exists.append(f"Jupiter is placed in a Dusthana house ({h} house).")
        if "debilitated" in dig:
            afflicted = True
            why_exists.append("Jupiter is debilitated in Capricorn.")
            aggravating_factors.append("Jupiter debility restricts expansive wisdom growth.")
        if is_combust:
            afflicted = True
            why_exists.append("Jupiter is combust.")
            aggravating_factors.append("Combustion weakens guidance clarity.")

        if afflicted:
            detected = True
            formation_strength = 3
            
            s_h = int(planets.get("saturn", {}).get("house", 0))
            if s_h == h or "saturn" in aspect_map.get(h, []):
                formation_strength = 4
                why_exists.append("Jupiter is conjunct/aspected by Saturn.")
                
            if "debilitated" in dig:
                m_h = int(planets.get("mars", {}).get("house", 0))
                if "mars" in aspect_map.get(h, []) or m_h == h:
                    mitigation_status = "Strong"
                    protective_factors.append("Neechabhanga Raj Yoga is active: Mars aspect cancels debility.")
                else:
                    mitigation_status = "Weak"
            else:
                mitigation_status = "Moderate"

            mahadasha_active = False
            if dasha_package:
                curr_maha = dasha_package.get("current_mahadasha", {})
                mahadasha_active = (curr_maha.get("planet") or "").lower() == "jupiter"

            if mahadasha_active:
                current_influence = "High"
            else:
                current_influence = "Low"
                protective_factors.append("Jupiter is not in active Mahadasha cycles.")

            if mitigation_status == "Strong":
                overall_impact = "Low–Moderate"
                practical_impact = "Minimal"
            else:
                overall_impact = "Moderate"
                practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict(["Jupiter"], dasha_package, current_influence)

    return DoshaEvidence(
        name="Guru Affliction",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Grounded beliefs", "Logical analysis of wisdom", "Financial restoration capabilities"],
        challenges=["Financial goals delayed", "Teachers require verification", "Lack of spiritual trust"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Donate yellow items", "Chant 'Om Brim Brihaspataye Namaha'"],
            "lifestyle": ["Maintain objectivity in learning", "Avoid liver-taxing diet setups"],
            "practical": ["Consult multiple mentors", "Seek advice before large financial deals"]
        },
        life_areas_affected={
            "career": "Low",
            "marriage": "Moderate",
            "finance": "Moderate",
            "health": "None",
            "children": "Minimal"
        },
        mitigation_status=mitigation_status
    )


def check_ninth_house_affliction(planets: dict, houses_lord: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    detected = False
    why_exists = []
    protective_factors = []
    aggravating_factors = []
    
    formation_strength = 1
    mitigation_status = "None"
    current_influence = "Low"
    overall_impact = "Minimal"
    practical_impact = "Minimal"

    lord = houses_lord.get(9)
    if lord:
        ld = planets.get(lord.lower())
        if isinstance(ld, dict):
            h_lord = int(ld.get("house", 0))
            dig = (ld.get("dignity") or "neutral").lower()
            is_combust = bool(ld.get("combust"))
            
            if h_lord in [6, 8, 12] or "debilitated" in dig or is_combust:
                detected = True
                why_exists.append(f"The 9th house lord ({lord.capitalize()}) is in house {h_lord}.")
                formation_strength = 3
                
                if "debilitated" in dig:
                    formation_strength = 4
                    why_exists.append(f"9th lord ({lord.capitalize()}) is debilitated.")
                    aggravating_factors.append("Lord debility affects luck patterns.")
                    
                if "jupiter" in aspect_map.get(9, []) or "jupiter" in aspect_map.get(h_lord, []):
                    mitigation_status = "Strong"
                    protective_factors.append("Jupiter aspects 9th house or lord, shielding dharma.")
                else:
                    mitigation_status = "Weak"

                mahadasha_active = False
                if dasha_package:
                    curr_maha = dasha_package.get("current_mahadasha", {})
                    mahadasha_active = (curr_maha.get("planet") or "").lower() == lord.lower()

                if mahadasha_active:
                    current_influence = "High"
                else:
                    current_influence = "Low"
                    protective_factors.append("9th lord not active in major Mahadasha cycles.")

                if mitigation_status == "Strong":
                    overall_impact = "Low–Moderate"
                    practical_impact = "Minimal"
                else:
                    overall_impact = "Moderate"
                    practical_impact = "Moderate"

    timeline_dict = _calculate_timeline_dict([lord] if lord else [], dasha_package, current_influence)

    return DoshaEvidence(
        name="Ninth House Affliction",
        detected=detected,
        formation_strength=formation_strength if detected else 0,
        confidence="Moderate",
        status=timeline_dict["current"] if detected else "None",
        practical_impact=practical_impact if detected else "Minimal",
        why_exists=why_exists,
        positive_traits=["Self-made growth trajectory", "Deep research of spiritual values", "Strong ethical indexes"],
        challenges=["Academic delays", "Friction with father or mentors", "Minor luck blocks"],
        protective_factors=protective_factors,
        aggravating_factors=aggravating_factors,
        timeline=timeline_dict,
        remedies={
            "spiritual": ["Donate yellow books to students", "Pray to family deity regularly"],
            "lifestyle": ["Follow moral codes in career", "Learn to accept delays calmly"],
            "practical": ["Systematic family legal archiving", "Confirm foreign visa files before deadlines"]
        },
        life_areas_affected={
            "career": "Moderate",
            "marriage": "Low",
            "finance": "Low",
            "health": "None",
            "children": "None"
        },
        mitigation_status=mitigation_status
    )


def check_sade_sati_dosha(chart_data: dict, aspect_map: dict, dasha_package: Optional[dict]) -> DoshaEvidence:
    """Read pre-computed Sade Sati transit status from chart data and build evidence."""
    ss_data = None
    if isinstance(chart_data, dict):
        ss_data = chart_data.get("doshas", {}).get("sade_sati") or chart_data.get("sade_sati")
        
    detected = False
    why_exists = []
    phase = "Active Phase"
    description = "Saturn is currently in transit."
    
    if isinstance(ss_data, dict) and ss_data.get("is_present"):
        detected = True
        phase = ss_data.get("phase") or "Active Phase"
        description = ss_data.get("description") or "Saturn transits the 12th, 1st, or 2nd house from the natal Moon."
        why_exists.append(description)
        if "First Phase" in phase or "12th" in phase:
            why_exists.append("Saturn occupies the 12th house relative to your natal Moon (First Phase of Sade Sati).")
        elif "Second Phase" in phase or "Peak" in phase or "1st" in phase:
            why_exists.append("Saturn transits directly over your natal Moon (Peak/Second Phase of Sade Sati).")
        elif "Third Phase" in phase or "2nd" in phase:
            why_exists.append("Saturn transits the 2nd house relative to your natal Moon (Rising/Third Phase of Sade Sati).")

    protective_factors = []
    aggravating_factors = []
    formation_strength = 1
    current_influence = "Low"
    practical_impact = "Minimal"
    mitigation_status = "Moderate"

    if detected:
        if "Peak" in phase or "Second" in phase or "1st" in phase:
            formation_strength = 5
            aggravating_factors.append("Saturn transiting directly over the natal Moon intensifies emotional and mental pressure.")
            current_influence = "Active"
            practical_impact = "Significant"
        else:
            formation_strength = 3
            current_influence = "Active"
            practical_impact = "Moderate"

        # Check if Jupiter aspects natal Moon for mitigation
        planets = chart_data.get("planets", {})
        moon = planets.get("moon")
        if isinstance(moon, dict):
            h_m = int(moon.get("house", 0))
            if h_m and "jupiter" in aspect_map.get(h_m, []):
                protective_factors.append("Jupiter aspects natal Moon, providing strong emotional cushioning.")
                mitigation_status = "Strong"
                practical_impact = "Minimal" if practical_impact == "Moderate" else "Moderate"
                
        # Default protective factors
        protective_factors.append("Transit Saturn is not in direct combustion.")

        remedies = {
            "spiritual": [
                "Light a sesame oil lamp under a Peepal tree on Saturdays",
                "Chant Shani Gayatri Mantra or Hanuman Chalisa regularly",
                "Donate black sesame seeds or black wool on Saturdays"
            ],
            "lifestyle": [
                "Maintain high levels of discipline, patience, and humility",
                "Avoid unnecessary arguments and conflicts with elder family members",
                "Dedicate time to clean, orderly daily habits (Dinacharya)"
            ],
            "practical": [
                "Set aside automated savings to buffer cash flow fluctuations",
                "Do not make highly speculative financial decisions",
                "Engage in charity or voluntary work for the underprivileged"
            ]
        }

        timeline_dict = {
            "current": "Active" if current_influence == "Active" else "Dormant",
            "next_activation": "Ongoing Transit Cycle",
            "estimated_period": phase
        }

        return DoshaEvidence(
            name="Sade Sati",
            detected=detected,
            formation_strength=formation_strength,
            confidence="High",
            status=timeline_dict["current"],
            practical_impact=practical_impact,
            why_exists=why_exists,
            positive_traits=["Builds immense spiritual resilience", "Teaches long-term patience", "Structures professional focus"],
            challenges=["Increased mental anxiety or fatigue", "Delays in projected financial outcomes", "Feeling of isolation or excessive load"],
            protective_factors=protective_factors,
            aggravating_factors=aggravating_factors,
            timeline=timeline_dict,
            remedies=remedies,
            life_areas_affected={
                "career": "Moderate",
                "marriage": "Low",
                "finance": "Moderate",
                "health": "Moderate",
                "children": "None"
            },
            mitigation_status=mitigation_status
        )

    return DoshaEvidence(
        name="Sade Sati",
        detected=False,
        formation_strength=0,
        confidence="Moderate",
        status="None",
        practical_impact="Minimal",
        why_exists=[],
        positive_traits=[],
        challenges=[],
        protective_factors=[],
        aggravating_factors=[],
        timeline={"current": "Dormant", "next_activation": "None", "estimated_period": "None"},
        remedies={"spiritual": [], "lifestyle": [], "practical": []},
        life_areas_affected={},
        mitigation_status="None"
    )


# ═══════════════════════════════════════════════════════════════
# MAIN TIMELINE DOSHA GENERATOR
# ═══════════════════════════════════════════════════════════════

def generate_detailed_timeline(planets_involved: list, dasha_package: Optional[dict], birth_year: int) -> list:
    timeline_blocks = []
    if not dasha_package or not planets_involved:
        return timeline_blocks
        
    involved = [p.lower() for p in planets_involved if p]
    
    mahas = []
    antars = []
    
    for maha in dasha_package.get("timeline", []):
        mp = maha["planet"].lower()
        m_start = datetime.date.fromisoformat(maha["start_date"]).year
        m_end = datetime.date.fromisoformat(maha["end_date"]).year
        
        if mp in involved:
            mahas.append((m_start, m_end, f"{maha['planet_name']} Mahadasha"))
            
        for antar in maha.get("antardashas", []):
            ap = antar["planet"].lower()
            a_start = datetime.date.fromisoformat(antar["start_date"]).year
            a_end = datetime.date.fromisoformat(antar["end_date"]).year
            if ap in involved:
                antars.append((a_start, a_end, f"{antar['planet_name']} Antardasha"))
                
    years = [birth_year + i for i in range(101)]
    year_status = {}
    for y in years:
        status = "Dormant"
        reason = "Dormant period"
        for s, e, r in antars:
            if s <= y <= e:
                status = "Moderate Influence"
                reason = r
        for s, e, r in mahas:
            if s <= y <= e:
                status = "High Influence"
                reason = r
        year_status[y] = (status, reason)
        
    grouped = []
    start_y = years[0]
    curr_status, curr_reason = year_status[start_y]
    
    for y in years[1:]:
        s, r = year_status[y]
        if s != curr_status:
            grouped.append({
                "period": f"{start_y}–{y-1}",
                "influence": curr_status,
                "reason": curr_reason
            })
            start_y = y
            curr_status, curr_reason = s, r
            
    grouped.append({
        "period": f"{start_y}+",
        "influence": curr_status,
        "reason": curr_reason
    })
    
    return grouped


def compute_doshas(chart_data: dict, computed: Optional[dict] = None) -> dict:
    """
    Computes all Vedic astrology doshas and groups them into completed, ongoing, and upcoming timelines.
    Returns structured JSON only, strictly avoiding LLM generation.
    """
    planets = chart_data.get("planets", {})
    raw_houses = chart_data.get("houses", {})
    houses_lord = {}
    for h_str, h_data in raw_houses.items():
        if isinstance(h_data, dict):
            lord = h_data.get("lord")
            if lord:
                houses_lord[int(h_str)] = lord.lower()

    aspect_map = _build_aspect_map(planets)

    # Resolve Dasha Package
    dasha_package = None
    birth_year = datetime.date.today().year - 30
    try:
        moon_data = planets.get("moon", {})
        moon_long = float(moon_data.get("longitude", 120.0)) if isinstance(moon_data, dict) else 120.0
        
        meta = chart_data.get("metadata", {})
        raw_dob = (
            meta.get("date_of_birth") or meta.get("birth_date") or meta.get("date_str") or
            chart_data.get("date_of_birth") or "1998-05-15"
        )
        
        birth_dt = None
        try:
            from backend.utils.date_parser import parse_date_str
            birth_dt = parse_date_str(str(raw_dob))
        except Exception:
            birth_dt = datetime.date(1998, 5, 15)
            
        birth_year = birth_dt.year
        dasha_package = calculate_full_dasha_package(moon_long, birth_dt)
    except Exception as d_err:
        print(f"[DoshaReasoning] Dasha packing failed: {d_err}")

    # Detectors
    manglik = check_manglik_dosha(planets, aspect_map, dasha_package)
    partial_manglik = check_partial_manglik(planets, aspect_map, manglik.detected, dasha_package)
    kaal_sarp = check_kaal_sarp(planets, aspect_map, dasha_package)
    pitra = check_pitra_dosha(planets, aspect_map, dasha_package)
    shrapit = check_shrapit_dosha(planets, aspect_map, dasha_package)
    surya_grahan = check_surya_grahan(planets, aspect_map, dasha_package)
    chandra_grahan = check_chandra_grahan(planets, aspect_map, dasha_package)
    guru_chandal = check_guru_chandal(planets, aspect_map, dasha_package)
    kemadruma = check_kemadruma(planets, aspect_map, dasha_package)
    chandra_dosha = check_chandra_dosha(planets, aspect_map, dasha_package)
    daridra = check_daridra_dosha(planets, houses_lord, aspect_map, dasha_package)
    sarpa_influence = check_sarpa_influence(planets, aspect_map, dasha_package)
    aff_six = check_afflicted_sixth_house(planets, houses_lord, aspect_map, dasha_package)
    aff_eight = check_afflicted_eighth_house(planets, houses_lord, aspect_map, dasha_package)
    guru_aff = check_guru_affliction(planets, aspect_map, dasha_package)
    aff_nine = check_ninth_house_affliction(planets, houses_lord, aspect_map, dasha_package)
    sade_sati = check_sade_sati_dosha(chart_data, aspect_map, dasha_package)

    # Evidences map to planets involved
    evidence_planets = [
        (manglik, ["mars"], True),
        (partial_manglik, ["mars"], True),
        (kaal_sarp, ["rahu", "ketu"], True),
        (pitra, ["sun", "rahu", "ketu", "saturn"], True),
        (shrapit, ["saturn", "rahu"], True),
        (surya_grahan, ["sun", "rahu", "ketu"], True),
        (chandra_grahan, ["moon", "rahu", "ketu"], True),
        (guru_chandal, ["jupiter", "rahu", "ketu"], True),
        (kemadruma, ["moon"], True),
        (chandra_dosha, ["moon"], True),
        (daridra, [houses_lord.get(2), houses_lord.get(11)], True),
        (sarpa_influence, ["rahu", "ketu"], True),
        (aff_six, [houses_lord.get(6)], True),
        (aff_eight, [houses_lord.get(8)], True),
        (guru_aff, ["jupiter", "saturn"], True),
        (aff_nine, [houses_lord.get(9)], True),
        (sade_sati, ["saturn", "moon"], True)
    ]

    completed_list = []
    ongoing_list = []
    upcoming_list = []

    current_year = datetime.date.today().year

    for ev, planets_involved, is_permanent in evidence_planets:
        if not ev.detected:
            continue
            
        clean_planets = [p.lower() for p in planets_involved if p]
        detailed_timeline = generate_detailed_timeline(clean_planets, dasha_package, birth_year)
        
        if ev.name == "Sade Sati":
            ongoing_list.append({
                "name": ev.name,
                "started": str(current_year - 2),
                "expected_end": str(current_year + 5),
                "activation_reason": ev.timeline.get("estimated_period") or "Saturn Transit Cycle",
                "severity": ev.practical_impact,
                "confidence": ev.confidence,
                "is_permanent": is_permanent,
                "why_exists": ev.why_exists,
                "why_active": "Saturn transiting near natal Moon sign.",
                "formation_strength": ev.formation_strength,
                "practical_impact": ev.practical_impact,
                "positive_traits": ev.positive_traits,
                "challenges": ev.challenges,
                "protective_factors": ev.protective_factors,
                "remedies": ev.remedies,
                "detailed_timeline": detailed_timeline,
                "timeline": ev.timeline
            })
            continue

        mahas = []
        antars = []
        
        if dasha_package:
            for maha in dasha_package.get("timeline", []):
                mp = maha["planet"].lower()
                m_start = datetime.date.fromisoformat(maha["start_date"]).year
                m_end = datetime.date.fromisoformat(maha["end_date"]).year
                if mp in clean_planets:
                    mahas.append((m_start, m_end, f"{maha['planet_name']} Mahadasha", maha["status"]))
                for antar in maha.get("antardashas", []):
                    ap = antar["planet"].lower()
                    a_start = datetime.date.fromisoformat(antar["start_date"]).year
                    a_end = datetime.date.fromisoformat(antar["end_date"]).year
                    if ap in clean_planets:
                        antars.append((a_start, a_end, f"{antar['planet_name']} Antardasha", antar["status"]))

        has_current_maha = any(s == "current" for _, _, _, s in mahas)
        has_current_antar = any(s == "current" for _, _, _, s in antars)
        
        if has_current_maha or has_current_antar:
            active_dasha = next(((st, ed, rs) for st, ed, rs, s in mahas if s == "current"), None)
            if not active_dasha:
                active_dasha = next(((st, ed, rs) for st, ed, rs, s in antars if s == "current"), None)
                
            st_yr, ed_yr, d_name = active_dasha if active_dasha else (current_year, current_year + 5, "Planet Dasha")
            
            ongoing_list.append({
                "name": ev.name,
                "started": str(st_yr),
                "expected_end": str(ed_yr),
                "activation_reason": d_name,
                "severity": ev.practical_impact,
                "confidence": ev.confidence,
                "is_permanent": is_permanent,
                "why_exists": ev.why_exists,
                "why_active": f"Activated by current running {d_name}.",
                "formation_strength": ev.formation_strength,
                "practical_impact": ev.practical_impact,
                "positive_traits": ev.positive_traits,
                "challenges": ev.challenges,
                "protective_factors": ev.protective_factors,
                "remedies": ev.remedies,
                "detailed_timeline": detailed_timeline,
                "timeline": ev.timeline
            })
            
        elif any(s == "upcoming" for _, _, _, s in mahas) or any(s == "upcoming" for _, _, _, s in antars):
            upcoming_dashas = [(st, ed, rs) for st, ed, rs, s in mahas if s == "upcoming"] + \
                              [(st, ed, rs) for st, ed, rs, s in antars if s == "upcoming"]
            upcoming_dashas.sort(key=lambda x: x[0])
            st_yr, ed_yr, d_name = upcoming_dashas[0] if upcoming_dashas else (current_year + 5, current_year + 10, "Upcoming Dasha")
            
            upcoming_list.append({
                "name": ev.name,
                "expected_start": str(st_yr),
                "expected_end": str(ed_yr),
                "activation_reason": d_name,
                "current_status": "Dormant",
                "confidence": ev.confidence or "Moderate",
                "is_permanent": is_permanent,
                "why_exists": ev.why_exists,
                "why_active": f"Will trigger during upcoming {d_name}.",
                "formation_strength": ev.formation_strength,
                "practical_impact": ev.practical_impact,
                "positive_traits": ev.positive_traits,
                "challenges": ev.challenges,
                "protective_factors": ev.protective_factors,
                "remedies": ev.remedies,
                "detailed_timeline": detailed_timeline,
                "timeline": ev.timeline
            })
            
        else:
            completed_dashas = [(st, ed, rs) for st, ed, rs, s in mahas if s == "completed"] + \
                               [(st, ed, rs) for st, ed, rs, s in antars if s == "completed"]
            completed_dashas.sort(key=lambda x: x[1], reverse=True)
            st_yr, ed_yr, d_name = completed_dashas[0] if completed_dashas else (current_year - 10, current_year - 5, "Completed Dasha")
            
            completed_list.append({
                "name": ev.name,
                "active_period": f"{st_yr}–{ed_yr}",
                "activation_reason": d_name,
                "current_impact": "Minimal",
                "confidence": ev.confidence or "Moderate",
                "is_permanent": is_permanent,
                "why_exists": ev.why_exists,
                "why_active": f"Last active during {d_name} (now completed).",
                "formation_strength": ev.formation_strength,
                "practical_impact": ev.practical_impact,
                "positive_traits": ev.positive_traits,
                "challenges": ev.challenges,
                "protective_factors": ev.protective_factors,
                "remedies": ev.remedies,
                "detailed_timeline": detailed_timeline,
                "timeline": ev.timeline
            })

    total_detected = len(completed_list) + len(ongoing_list) + len(upcoming_list)

    summary = {
        "total_detected": total_detected,
        "ongoing": len(ongoing_list),
        "completed": len(completed_list),
        "upcoming": len(upcoming_list)
    }

    return {
        "summary": summary,
        "completed": completed_list,
        "ongoing": ongoing_list,
        "upcoming": upcoming_list
    }
