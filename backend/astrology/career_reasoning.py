"""
Career Reasoning Engine (Layer 2) — Deterministic Career Astrology Evidence Synthesis.

This module evaluates professional alignments:
- Calculates planetary career strengths (10th lord, Amatyakaraka, occupants)
- Ranks career domains to recommend the top 3 fields
- Evaluates Job (Service) vs Business (Entrepreneurship) alignment
- Computes Dasha career timing and active vs dormant opportunities
- Outputs a structured CareerEvidenceBrief for the LLM to write as prose
"""

from typing import Dict, List, Tuple, Optional, Any

# ═══════════════════════════════════════════════════════════════
# CONSTANTS & CONFIGURATION
# ═══════════════════════════════════════════════════════════════

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
DUSTHANA_HOUSES = {6, 8, 12}

CAREER_DOMAINS = {
    "technology": {
        "label": "Technology & Engineering (Software, AI, Data, Systems)",
        "primary_planets": ["mercury", "mars", "rahu"],
        "supporting_houses": [3, 5, 10],
        "keywords": "software engineering, AI and machine learning, database systems, cybersecurity, technical research",
    },
    "finance": {
        "label": "Finance, Investment & Banking (Wealth & Markets)",
        "primary_planets": ["jupiter", "mercury", "venus"],
        "supporting_houses": [2, 5, 11],
        "keywords": "investment banking, financial analysis, corporate accounting, stock markets, wealth advisory",
    },
    "administration_govt": {
        "label": "Administration & Public Services (Govt, Leadership, IAS)",
        "primary_planets": ["sun", "mars", "jupiter"],
        "supporting_houses": [1, 10, 11],
        "keywords": "civil service, public administration, administrative leadership, policy-making, PSU management",
    },
    "business_entrepreneurship": {
        "label": "Business & Entrepreneurship (Self-employment, Startups)",
        "primary_planets": ["mercury", "venus", "rahu"],
        "supporting_houses": [3, 7, 11],
        "keywords": "startup leadership, commercial retail, international trade, brand building, self-employment",
    },
    "research_education": {
        "label": "Research, Education & Consulting (Vidya & Advice)",
        "primary_planets": ["jupiter", "mercury", "ketu"],
        "supporting_houses": [4, 5, 9],
        "keywords": "academic research, educational teaching, corporate consulting, deep analysis, content curation",
    },
    "creative_arts": {
        "label": "Creative Arts, Design & Media (Art, Design, Writing)",
        "primary_planets": ["venus", "moon", "mercury"],
        "supporting_houses": [3, 5, 10],
        "keywords": "graphic design, copywriting, performing arts, content creation, fashion and lifestyle design",
    },
    "healthcare_medicine": {
        "label": "Healthcare & Medicine (Healing, Diagnostics, Care)",
        "primary_planets": ["sun", "mars", "ketu"],
        "supporting_houses": [6, 8, 10],
        "keywords": "medical diagnostics, surgical practice, alternative healing, pharmacology, clinical care",
    },
    "law_legal": {
        "label": "Law & Legal Services (Advocacy, Compliance)",
        "primary_planets": ["jupiter", "saturn", "mars"],
        "supporting_houses": [6, 9, 10],
        "keywords": "legal advocacy, corporate compliance, policy advice, dispute resolution, contract drafting",
    },
}

# ═══════════════════════════════════════════════════════════════
# HELPERS & COMPILATIONS
# ═══════════════════════════════════════════════════════════════

def _get_planet_dignity_weight(dignity: str) -> float:
    d = dignity.lower()
    if "exalted" in d:
        return 3.0
    if "own" in d or "moolatrikona" in d:
        return 2.0
    if "friend" in d:
        return 1.0
    if "enemy" in d:
        return -1.0
    if "debilitated" in d:
        return -2.0
    return 0.0

def _get_amatyakaraka(planets: dict) -> str:
    """Determine Amatyakaraka (2nd highest degree in Janma Kundli)."""
    seven_planets = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]
    planet_degrees = []
    for p_name in seven_planets:
        p = planets.get(p_name) or {}
        if isinstance(p, dict):
            long_val = p.get("longitude") or p.get("deg") or p.get("degree") or 0.0
            sign_deg = float(long_val) % 30.0
            planet_degrees.append((sign_deg, p_name))
    
    if len(planet_degrees) >= 2:
        planet_degrees.sort(key=lambda x: x[0], reverse=True)
        return planet_degrees[1][1]
    return "mercury"

# ═══════════════════════════════════════════════════════════════
# MAIN REASONING LOGIC
# ═══════════════════════════════════════════════════════════════

def compute_career_evidence(chart_data: dict, computed: Optional[dict] = None) -> dict:
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    
    # 1. 10th house parameters
    h10 = houses.get("10", {})
    lord_10 = (h10.get("lord") or "mercury").lower()
    
    # 2. Amatyakaraka (AmK)
    amk = _get_amatyakaraka(planets)
    
    # 3. Calculate individual planet strengths for career purposes
    planet_strengths = {}
    for p_name, p_data in planets.items():
        if not isinstance(p_data, dict):
            continue
        p_lower = p_name.lower()
        dignity = p_data.get("dignity") or "neutral"
        house = int(p_data.get("house", 0))
        is_retro = bool(p_data.get("retrograde"))
        is_combust = bool(p_data.get("combust"))
        
        # Base dignity score
        score = _get_planet_dignity_weight(dignity)
        
        # House adjustment
        if house in KENDRA_HOUSES:
            score += 1.5
        elif house in TRIKONA_HOUSES:
            score += 1.0
        elif house in DUSTHANA_HOUSES:
            score -= 1.0
            
        if is_combust and p_lower not in ["sun", "rahu", "ketu"]:
            score -= 1.5
        if is_retro and p_lower not in ["rahu", "ketu"]:
            score += 0.5  # retrograde adds internal intensity
            
        planet_strengths[p_lower] = score

    # 4. Job vs Business Alignment (6th house/lord vs 7th house/lord)
    h6 = houses.get("6", {})
    h7 = houses.get("7", {})
    lord_6 = (h6.get("lord") or "mars").lower()
    lord_7 = (h7.get("lord") or "venus").lower()
    
    score_6th = planet_strengths.get(lord_6, 0.0) + (1.0 if any(p.get("house") == 6 for p in planets.values()) else 0.0)
    score_7th = planet_strengths.get(lord_7, 0.0) + (1.0 if any(p.get("house") == 7 for p in planets.values()) else 0.0)
    
    # Add Amatyakaraka / Lagna lord bias
    lagna_lord = (houses.get("1", {}).get("lord") or "mars").lower()
    if lagna_lord in ["mercury", "venus", "rahu"]:
        score_7th += 1.0  # Natural entrepreneurs
    else:
        score_6th += 1.0
        
    path_verdict = "Corporate Employment & Service (Job)" if score_6th >= score_7th else "Entrepreneurship, Business & Self-Employment"
    path_justification = (
        f"Your 6th house (service) strength score is {round(score_6th, 1)} compared to your 7th house (business) score of {round(score_7th, 1)}. "
        f"The {lord_6.capitalize()} lord of service placement versus the {lord_7.capitalize()} lord of partnership drives this alignment."
    )

    # 5. Evaluate Career Domains & Select Top 3
    scored_domains = []
    for d_key, d_config in CAREER_DOMAINS.items():
        base_score = 0.0
        
        # Influence of signifier planets
        for p in d_config["primary_planets"]:
            base_score += planet_strengths.get(p, 0.0)
            
        # Add bonus if signifiers are 10th lord or AmK
        for p in d_config["primary_planets"]:
            if p == lord_10:
                base_score += 2.0
            if p == amk:
                base_score += 1.5
                
        # House placement checks
        for h_num in d_config["supporting_houses"]:
            h_data = houses.get(str(h_num), {})
            h_lord = (h_data.get("lord") or "").lower()
            if h_lord in d_config["primary_planets"]:
                base_score += 1.0
                
        scored_domains.append({
            "key": d_key,
            "label": d_config["label"],
            "score": round(base_score, 1),
            "keywords": d_config["keywords"],
        })
        
    scored_domains.sort(key=lambda x: x["score"], reverse=True)
    top_3 = scored_domains[:3]

    # 6. Current Dasha Activation
    meta = chart_data.get("metadata", {})
    current_dasha = (meta.get("current_dasha") or chart_data.get("current_dasha") or "unknown").lower()
    
    active_dashas = []
    if current_dasha != "unknown":
        active_dashas.append(current_dasha.split("-")[0].strip())
        if "-" in current_dasha:
            active_dashas.append(current_dasha.split("-")[1].strip())
            
    # Check activation for top 3
    for d in top_3:
        activated = False
        reason = "Dormant under present planetary period"
        for p in CAREER_DOMAINS[d["key"]]["primary_planets"]:
            if p in active_dashas:
                activated = True
                reason = f"Activated by current {p.capitalize()} Dasha sub-period"
                break
        d["activated"] = activated
        d["activation_status"] = "Active" if activated else "Dormant"
        d["activation_reason"] = reason

    return {
        "lord_10": lord_10,
        "amk": amk,
        "path_verdict": path_verdict,
        "path_justification": path_justification,
        "top_3": top_3,
        "current_dasha": meta.get("current_dasha") or "Not Computed",
    }

def format_career_evidence_for_prompt(evidence: dict) -> str:
    lines = []
    lines.append("=" * 60)
    lines.append("CAREER EVIDENCE BRIEF — PRE-COMPUTED BY REASONING ENGINE")
    lines.append("Write from these conclusions. Do NOT independently")
    lines.append("re-interpret planetary positions. All interactions are computed.")
    lines.append("=" * 60)
    
    lines.append("")
    lines.append("[CAREER FOUNDATIONS]")
    lines.append(f"10th House Lord (Karma Lord): {evidence['lord_10'].capitalize()}")
    lines.append(f"Amatyakaraka (AmK): {evidence['amk'].capitalize()}")
    lines.append(f"Current Dasha: {evidence['current_dasha']}")
    
    lines.append("")
    lines.append("[JOB VS BUSINESS ALIGNMENT]")
    lines.append(f"Verdict: {evidence['path_verdict']}")
    lines.append(f"Justification: {evidence['path_justification']}")
    
    lines.append("")
    lines.append("[TOP 3 RECOMMENDED CAREER DOMAINS]")
    for i, d in enumerate(evidence["top_3"], 1):
        lines.append(f"--- {i}. {d['label']} ---")
        lines.append(f"Veda Score: {d['score']}")
        lines.append(f"Manifestation Status: {d['activation_status']} ({d['activation_reason']})")
        lines.append(f"Ideal Roles: {d['keywords']}")
        lines.append("")
        
    return "\n".join(lines)
