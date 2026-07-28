"""
Health Reasoning Engine (Layer 2) — Deterministic Astrological Evidence Synthesis.

This module implements the core reasoning that a human astrologer performs:
- Evaluates ALL planetary positions, dignities, and aspects simultaneously
- Computes INTERACTIONS between planets (mitigations, amplifications, conflicts)
- Determines DASHA ACTIVATION status (active vs dormant indications)
- Synthesizes ONE coherent health assessment per domain
- Outputs a structured HealthEvidenceBrief for the LLM to write as prose

Architecture:
  chart_data → compute_health_evidence() → HealthEvidenceBrief dict
  HealthEvidenceBrief → format_evidence_for_prompt() → structured text for LLM

The LLM NEVER interprets planets. This engine decides. The LLM only writes.
"""

from typing import Dict, List, Tuple, Optional, Any


# ═══════════════════════════════════════════════════════════════
# CONSTANTS & CONFIGURATION
# ═══════════════════════════════════════════════════════════════

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
DUSTHANA_HOUSES = {6, 8, 12}

SEVERITY_SCALE = ["negligible", "low", "moderate", "elevated", "high"]

# Health domains with their planetary/house signifiers (Parashari mappings)
HEALTH_DOMAINS = {
    "cardiovascular": {
        "label": "Heart & Cardiovascular Vitality",
        "emoji": "🫀",
        "primary_planets": ["sun"],
        "secondary_planets": ["mars"],
        "primary_houses": [4, 5],
        "body_systems": "heart, arteries, blood pressure, circulation, core vitality (Ojas)",
    },
    "digestive_metabolic": {
        "label": "Digestive Fire (Agni) & Metabolic Health",
        "emoji": "🔥",
        "primary_planets": ["jupiter"],
        "secondary_planets": ["mars", "sun"],
        "primary_houses": [6],
        "body_systems": "liver, pancreas, gallbladder, intestinal absorption, fat metabolism, blood sugar",
    },
    "nervous_sleep": {
        "label": "Nervous System, Sleep & Mental Wellness",
        "emoji": "🧠",
        "primary_planets": ["moon", "mercury"],
        "secondary_planets": [],
        "primary_houses": [12],
        "body_systems": "brain, neural transmission, sleep architecture, mental calm, anxiety, depression",
    },
    "skin_dermatological": {
        "label": "Skin & Dermatological Integrity",
        "emoji": "🩹",
        "primary_planets": ["mercury", "venus"],
        "secondary_planets": ["rahu"],
        "primary_houses": [6],
        "body_systems": "skin epidermis, complexion, eczema, psoriasis, acne, dermatitis, vitiligo, allergic rashes",
    },
    "musculoskeletal": {
        "label": "Joints, Bones & Structural System",
        "emoji": "🦴",
        "primary_planets": ["saturn"],
        "secondary_planets": ["mars", "sun"],
        "primary_houses": [1],
        "body_systems": "joints, cartilage, bone density, teeth, arthritis, Vata structural balance",
    },
    "renal_hormonal": {
        "label": "Renal, Hormonal & Reproductive Health",
        "emoji": "💧",
        "primary_planets": ["venus"],
        "secondary_planets": ["mars", "moon"],
        "primary_houses": [7, 8],
        "body_systems": "kidneys, urinary tract, hormonal/endocrine balance, reproductive system",
    },
    "immune_allergic": {
        "label": "Immunity & Allergic Sensitivity",
        "emoji": "🛡️",
        "primary_planets": ["rahu", "ketu"],
        "secondary_planets": ["mars"],
        "primary_houses": [6, 8],
        "body_systems": "immune defense, allergies, autoimmune, viral/fungal susceptibility, toxins (Ama)",
    },
}

# Affliction weights — positive values increase vulnerability
AFFLICTION_WEIGHTS = {
    "debilitated": 3.0,
    "enemy": 1.5,
    "combust": 2.0,
    "house_6": 1.5,
    "house_8": 2.0,
    "house_12": 1.0,
    "conjunct_malefic": 1.0,
    "aspected_by_malefic": 0.75,
    "retrograde": 0.5,
    "dusthana_lord": 0.75,
}

# Protection weights — subtracted from affliction score
PROTECTION_WEIGHTS = {
    "exalted": 3.0,
    "own_sign": 2.0,
    "moolatrikona": 2.5,
    "friend_sign": 0.5,
    "kendra": 1.0,
    "trikona": 0.75,
    "aspected_by_jupiter": 1.5,
    "aspected_by_venus": 0.75,
    "conjunct_benefic": 1.0,
}


# ═══════════════════════════════════════════════════════════════
# ASPECT & CONJUNCTION COMPUTATION
# ═══════════════════════════════════════════════════════════════

def _get_aspected_houses(planet_name: str, planet_house: int) -> set:
    """Return set of house numbers (1-12) aspected by this planet (Vedic Drishti)."""
    if not planet_house:
        return set()
    h = int(planet_house)
    aspected = set()

    # All planets: 7th house aspect
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


def _classify_benefic_malefic(planets: dict) -> Tuple[set, set]:
    """Classify planets into benefic and malefic sets (Parashari rules)."""
    benefics = {"jupiter", "venus"}
    malefics = {"sun", "mars", "saturn", "rahu", "ketu"}

    # Moon: benefic if waxing (longitude 0-180° ahead of Sun)
    sun_lon = 0.0
    moon_lon = 0.0
    if isinstance(planets.get("sun"), dict):
        sun_lon = planets["sun"].get("longitude", 0.0)
    if isinstance(planets.get("moon"), dict):
        moon_lon = planets["moon"].get("longitude", 0.0)

    if (moon_lon - sun_lon) % 360 <= 180:
        benefics.add("moon")
    else:
        malefics.add("moon")

    # Mercury: benefic unless conjunct a natural malefic
    merc_data = planets.get("mercury")
    if isinstance(merc_data, dict):
        merc_house = merc_data.get("house")
        conj_malefic = False
        if merc_house:
            for m in ["mars", "saturn", "rahu", "ketu"]:
                m_data = planets.get(m)
                if isinstance(m_data, dict) and int(m_data.get("house", 0)) == int(merc_house):
                    conj_malefic = True
                    break
        if conj_malefic:
            malefics.add("mercury")
        else:
            benefics.add("mercury")

    return benefics, malefics


# ═══════════════════════════════════════════════════════════════
# PLANETARY AFFLICTION SCORING
# ═══════════════════════════════════════════════════════════════

def _compute_planet_affliction(
    planet_name: str,
    planet_data: dict,
    planets: dict,
    aspect_map: Dict[int, List[str]],
    conjunction_map: Dict[str, List[str]],
    benefics: set,
    malefics: set,
    house_lords: Dict[str, str],
) -> Tuple[float, List[str], List[str]]:
    """
    Compute net affliction score for one planet.

    Returns (score, affliction_reasons, protection_reasons).
    Positive = afflicted, negative = protected, zero = neutral.
    """
    score = 0.0
    afflictions: List[str] = []
    protections: List[str] = []

    dignity = (planet_data.get("dignity") or "neutral").lower()
    house = int(planet_data.get("house", 0))
    sign = planet_data.get("sign", "?")
    is_retro = bool(planet_data.get("retrograde"))
    is_combust = bool(planet_data.get("combust"))
    p_lower = planet_name.lower()

    # ── Affliction factors ──

    if "debilitated" in dignity:
        score += AFFLICTION_WEIGHTS["debilitated"]
        afflictions.append(f"{planet_name.capitalize()} debilitated in {sign}")
    elif "enemy" in dignity:
        score += AFFLICTION_WEIGHTS["enemy"]
        afflictions.append(f"{planet_name.capitalize()} in enemy sign {sign}")

    if house == 6:
        score += AFFLICTION_WEIGHTS["house_6"]
        afflictions.append(f"Placed in 6th house (Roga Bhava — disease)")
    elif house == 8:
        score += AFFLICTION_WEIGHTS["house_8"]
        afflictions.append(f"Placed in 8th house (chronic vulnerability)")
    elif house == 12:
        score += AFFLICTION_WEIGHTS["house_12"]
        afflictions.append(f"Placed in 12th house (loss/hospitalization)")

    # Combustion (Rahu/Ketu cannot be combust)
    if is_combust and p_lower not in ("rahu", "ketu", "sun"):
        score += AFFLICTION_WEIGHTS["combust"]
        afflictions.append("Combust by Sun (significations severely weakened)")

    # Retrograde (Rahu/Ketu naturally retrograde — no penalty)
    if is_retro and p_lower not in ("rahu", "ketu"):
        score += AFFLICTION_WEIGHTS["retrograde"]
        afflictions.append("Retrograde (internalized, chronic expression)")

    # Conjunct malefics
    for cp in conjunction_map.get(planet_name, []):
        if cp in malefics and cp != planet_name:
            score += AFFLICTION_WEIGHTS["conjunct_malefic"]
            afflictions.append(f"Conjunct malefic {cp.capitalize()}")

    # Aspected by malefics
    if house:
        for asp_p in aspect_map.get(house, []):
            if asp_p in malefics and asp_p != planet_name:
                score += AFFLICTION_WEIGHTS["aspected_by_malefic"]
                afflictions.append(f"Aspected by malefic {asp_p.capitalize()}")

    # Dusthana lordship
    for h_num, lord in house_lords.items():
        if lord == planet_name and int(h_num) in DUSTHANA_HOUSES:
            score += AFFLICTION_WEIGHTS["dusthana_lord"]
            afflictions.append(f"Lords the {h_num}th house (dusthana lordship)")

    # ── Protection factors ──

    if "exalted" in dignity:
        score -= PROTECTION_WEIGHTS["exalted"]
        protections.append(f"{planet_name.capitalize()} exalted in {sign}")
    elif "own" in dignity:
        score -= PROTECTION_WEIGHTS["own_sign"]
        protections.append(f"{planet_name.capitalize()} in Own Sign {sign}")
    elif "moolatrikona" in dignity:
        score -= PROTECTION_WEIGHTS["moolatrikona"]
        protections.append(f"{planet_name.capitalize()} in Moolatrikona {sign}")
    elif "friend" in dignity:
        score -= PROTECTION_WEIGHTS["friend_sign"]
        protections.append(f"{planet_name.capitalize()} in friendly sign {sign}")

    if house in KENDRA_HOUSES:
        score -= PROTECTION_WEIGHTS["kendra"]
        protections.append(f"Kendra placement (House {house})")
    elif house in TRIKONA_HOUSES and house != 1:
        score -= PROTECTION_WEIGHTS["trikona"]
        protections.append(f"Trikona placement (House {house})")

    if house:
        for asp_p in aspect_map.get(house, []):
            if asp_p == "jupiter" and asp_p != planet_name:
                score -= PROTECTION_WEIGHTS["aspected_by_jupiter"]
                protections.append("Jupiter's benefic aspect — strong natural protection")
            elif asp_p == "venus" and asp_p != planet_name:
                score -= PROTECTION_WEIGHTS["aspected_by_venus"]
                protections.append("Venus's benefic aspect — healing and recovery support")

    for cp in conjunction_map.get(planet_name, []):
        if cp in benefics and cp != planet_name:
            score -= PROTECTION_WEIGHTS["conjunct_benefic"]
            protections.append(f"Conjunct benefic {cp.capitalize()}")

    return round(score, 2), afflictions, protections


# ═══════════════════════════════════════════════════════════════
# HOUSE CONDITION ASSESSMENT
# ═══════════════════════════════════════════════════════════════

def _assess_house_condition(
    house_num: int,
    houses: dict,
    planets: dict,
    aspect_map: Dict[int, List[str]],
    benefics: set,
    malefics: set,
    affliction_scores: dict,
) -> Tuple[float, List[str]]:
    """Assess how afflicted or protected a specific house is."""
    h_data = houses.get(str(house_num), {})
    adjustment = 0.0
    reasons: List[str] = []

    lord = (h_data.get("lord") or "").lower()

    # Lord's own affliction transfers to house
    if lord and lord in affliction_scores:
        lord_score = affliction_scores[lord]["score"]
        if lord_score > 2.0:
            adjustment += 1.0
            reasons.append(f"{house_num}th lord {lord.capitalize()} is afflicted (score {lord_score})")
        elif lord_score < -1.0:
            adjustment -= 0.5
            reasons.append(f"{house_num}th lord {lord.capitalize()} is well-protected")

    # Malefic occupants hurt the house
    for p_name, p_data in planets.items():
        if not isinstance(p_data, dict):
            continue
        if int(p_data.get("house", 0)) == house_num and p_name in malefics:
            adjustment += 0.75
            reasons.append(f"Malefic {p_name.capitalize()} occupies {house_num}th house")

    # Benefic aspects protect the house
    for asp_p in aspect_map.get(house_num, []):
        if asp_p in benefics:
            adjustment -= 0.5
            reasons.append(f"Benefic {asp_p.capitalize()} aspects {house_num}th house")

    return round(adjustment, 2), reasons


# ═══════════════════════════════════════════════════════════════
# DASHA EXTRACTION
# ═══════════════════════════════════════════════════════════════

def _extract_dasha_info(chart_data: dict) -> dict:
    """Extract current Mahadasha/Antardasha planets from chart data."""
    fallback = {
        "mahadasha": "", "mahadasha_start": "", "mahadasha_end": "",
        "antardasha": "", "antardasha_start": "", "antardasha_end": "",
    }
    try:
        from services.astrology.dasha import calculate_full_dasha_package
        import datetime

        planets = chart_data.get("planets", {})
        moon_data = planets.get("moon", {})
        moon_long = moon_data.get("longitude", 120.0) if isinstance(moon_data, dict) else 120.0

        meta = chart_data.get("metadata", {}) if isinstance(chart_data.get("metadata"), dict) else {}
        raw_dob = (
            meta.get("date_of_birth") or meta.get("birth_date") or
            chart_data.get("date_of_birth") or chart_data.get("birth_date") or "1998-05-15"
        )

        birth_dt = None
        try:
            from backend.utils.date_parser import parse_date_str
            birth_dt = parse_date_str(str(raw_dob))
        except Exception:
            try:
                birth_dt = datetime.date.fromisoformat(str(raw_dob)[:10])
            except Exception:
                birth_dt = datetime.date(1998, 5, 15)

        pkg = calculate_full_dasha_package(moon_long, birth_dt)
        maha = pkg.get("current_mahadasha", {})
        antar = pkg.get("current_antardasha", {})

        return {
            "mahadasha": (maha.get("planet_name") or "").lower(),
            "mahadasha_start": maha.get("start_date", ""),
            "mahadasha_end": maha.get("end_date", ""),
            "antardasha": (antar.get("planet_name") or "").lower() if antar else "",
            "antardasha_start": (antar.get("start_date") or "") if antar else "",
            "antardasha_end": (antar.get("end_date") or "") if antar else "",
        }
    except Exception:
        return fallback


# ═══════════════════════════════════════════════════════════════
# DOMAIN ASSESSMENT — The Core Synthesis
# ═══════════════════════════════════════════════════════════════

def _score_to_severity(score: float) -> str:
    """Convert numerical score to severity label."""
    if score <= 0:
        return "negligible"
    elif score <= 1.5:
        return "low"
    elif score <= 3.0:
        return "moderate"
    elif score <= 4.5:
        return "elevated"
    return "high"


def _determine_activation(domain_planets: List[str], dasha_info: dict) -> str:
    """Determine if a domain's signifier planets are activated by current dasha."""
    maha = dasha_info.get("mahadasha", "")
    antar = dasha_info.get("antardasha", "")

    if maha in domain_planets:
        return "active"
    if antar in domain_planets:
        return "partially_active"
    return "dormant"


def _generate_conclusion(
    label: str, severity: str, activation: str,
    primary_causes: List[str], aggravating: List[str],
    mitigating: List[str], body_systems: str,
) -> str:
    """Generate a deterministic net conclusion for a health domain."""
    parts: List[str] = []

    # Opening
    if severity == "high":
        parts.append(f"Significant vulnerability in {label.lower()} ({body_systems}).")
    elif severity == "elevated":
        parts.append(f"Elevated susceptibility for {label.lower()} ({body_systems}).")
    elif severity == "moderate":
        parts.append(f"Moderate tendency toward {label.lower()} concerns ({body_systems}).")
    elif severity == "low":
        parts.append(f"Mild, manageable tendencies in {label.lower()}.")
    else:
        parts.append(f"{label} is well-maintained and robustly protected.")

    # Causes
    if primary_causes:
        parts.append(f"Key factors: {'; '.join(primary_causes[:2])}.")

    # Interaction synthesis — the key differentiator
    if mitigating and severity in ("moderate", "elevated", "high"):
        if len(mitigating) >= len(aggravating):
            parts.append(
                f"However, substantial protective influence from "
                f"{'; '.join(mitigating[:2])} significantly reduces actual manifestation risk."
            )
        else:
            parts.append(
                f"Partial mitigation from {mitigating[0]}, "
                f"but aggravating factors outweigh protection."
            )
    elif aggravating and not mitigating and severity in ("moderate", "elevated", "high"):
        parts.append(
            f"Compounded by {'; '.join(aggravating[:2])} "
            f"without significant protective counterbalance."
        )
    elif severity in ("negligible", "low") and mitigating:
        parts.append(f"Strong protective support from {'; '.join(mitigating[:2])}.")

    # Dasha activation
    if activation == "active":
        parts.append(
            "CURRENTLY ACTIVATED by the running Mahadasha — "
            "heightened preventative care recommended."
        )
    elif activation == "partially_active":
        parts.append("Partially activated through current Antardasha — intermittent attention warranted.")
    elif activation == "dormant" and severity in ("moderate", "elevated", "high"):
        parts.append(
            "Currently DORMANT — not activated by present Dasha. "
            "Latent tendency that may surface during future relevant Dasha periods."
        )
    elif activation == "dormant":
        parts.append("Currently dormant and unlikely to manifest significantly.")

    return " ".join(parts)


def _assess_domain(
    domain_key: str,
    domain_config: dict,
    planets: dict,
    houses: dict,
    aspect_map: Dict[int, List[str]],
    conjunction_map: Dict[str, List[str]],
    affliction_scores: dict,
    benefics: set,
    malefics: set,
    dasha_info: dict,
) -> Optional[dict]:
    """Assess a single health domain with full interaction computation."""
    all_signifiers = domain_config["primary_planets"] + domain_config["secondary_planets"]

    domain_score = 0.0
    primary_causes: List[str] = []
    aggravating: List[str] = []
    mitigating: List[str] = []

    # ── Primary planet afflictions (full weight) ──
    for p_name in domain_config["primary_planets"]:
        if p_name not in affliction_scores:
            continue
        p_info = affliction_scores[p_name]
        p_score = p_info["score"]

        if p_score > 0:
            domain_score += p_score
            primary_causes.extend(p_info["afflictions"][:2])
            aggravating.extend(p_info["afflictions"][2:])

        if p_info["protections"]:
            mitigating.extend(p_info["protections"])

        if p_score < 0:
            domain_score += p_score * 0.5  # Negative score → protection reduces domain risk

    # ── Secondary planet afflictions (half weight) ──
    for p_name in domain_config["secondary_planets"]:
        if p_name not in affliction_scores:
            continue
        p_info = affliction_scores[p_name]
        p_score = p_info["score"]

        if p_score > 1.0:
            domain_score += p_score * 0.5
            aggravating.extend(p_info["afflictions"][:1])
        elif p_score < -1.0:
            mitigating.extend(p_info["protections"][:1])

    # ── House condition adjustments ──
    for h_num in domain_config["primary_houses"]:
        h_adj, h_reasons = _assess_house_condition(
            h_num, houses, planets, aspect_map, benefics, malefics, affliction_scores,
        )
        domain_score += h_adj
        if h_adj > 0:
            aggravating.extend(h_reasons)
        elif h_adj < 0:
            mitigating.extend(h_reasons)

    # ── Dasha activation adjustment ──
    activation = _determine_activation(all_signifiers, dasha_info)
    if activation == "active":
        domain_score += 1.0
    elif activation == "partially_active":
        domain_score += 0.5
    elif activation == "dormant":
        domain_score -= 0.5

    domain_score = max(0.0, domain_score)
    severity = _score_to_severity(domain_score)

    # Skip truly negligible domains with no notable factors
    if severity == "negligible" and not mitigating and not primary_causes:
        return None

    net_conclusion = _generate_conclusion(
        domain_config["label"], severity, activation,
        primary_causes, aggravating, mitigating, domain_config["body_systems"],
    )

    return {
        "domain": domain_config["label"],
        "domain_key": domain_key,
        "emoji": domain_config["emoji"],
        "body_systems": domain_config["body_systems"],
        "severity": severity,
        "severity_score": round(domain_score, 1),
        "activation": activation,
        "primary_causes": primary_causes[:3],
        "aggravating_factors": aggravating[:3],
        "mitigating_factors": mitigating[:3],
        "net_conclusion": net_conclusion,
    }


# ═══════════════════════════════════════════════════════════════
# CONSTITUTION & TRIDOSHA
# ═══════════════════════════════════════════════════════════════

def _assess_constitution(
    planets: dict,
    houses: dict,
    affliction_scores: dict,
    aspect_map: Dict[int, List[str]],
    benefics: set,
) -> dict:
    """Assess overall physical constitution from Lagna lord."""
    lagna_sign = houses.get("1", {}).get("sign", "Aries")
    lagna_lord = (houses.get("1", {}).get("lord") or "mars").lower()

    lord_info = affliction_scores.get(lagna_lord, {"score": 0, "afflictions": [], "protections": []})
    lord_score = lord_info["score"]
    lord_house = 0
    if isinstance(planets.get(lagna_lord), dict):
        lord_house = int(planets[lagna_lord].get("house", 0))

    jupiter_aspects_lagna = "jupiter" in aspect_map.get(1, [])

    if lord_score < -2:
        overall = "Excellent"
    elif lord_score < -0.5:
        overall = "Strong"
    elif lord_score < 1.5:
        overall = "Moderate"
    elif lord_score < 3:
        overall = "Below Average"
    else:
        overall = "Weak"

    if jupiter_aspects_lagna and overall in ("Moderate", "Below Average"):
        overall = "Moderate-Strong (Jupiter's protection)"

    lagna_protections: List[str] = []
    if jupiter_aspects_lagna:
        lagna_protections.append("Jupiter aspects Lagna — strong natural immunity boost")
    for asp_p in aspect_map.get(1, []):
        if asp_p in benefics and asp_p != "jupiter":
            lagna_protections.append(f"{asp_p.capitalize()} aspects Lagna — supportive vitality")

    return {
        "lagna_sign": lagna_sign,
        "lagna_lord": lagna_lord,
        "lagna_lord_score": lord_score,
        "lagna_lord_house": lord_house,
        "jupiter_aspects_lagna": jupiter_aspects_lagna,
        "protections": lagna_protections,
        "overall": overall,
    }


def _compute_tridosha(planets: dict, computed: Optional[dict] = None) -> dict:
    """Compute Tridosha balance."""
    if computed and isinstance(computed, dict) and computed.get("prakriti"):
        p = computed["prakriti"]
        dominant = p.get("dominant_dosha", "Balanced")
        return {
            "vata": p.get("vata", 33), "pitta": p.get("pitta", 33),
            "kapha": p.get("kapha", 33), "dominant": dominant,
        }

    # Fallback estimation from planetary elements
    vata_p = ["saturn", "rahu", "mercury"]
    pitta_p = ["mars", "sun", "ketu"]
    kapha_p = ["moon", "venus", "jupiter"]

    def _dosha_score(group: List[str]) -> float:
        s = 0.0
        for p in group:
            if p not in planets:
                continue
            s += 1.0
            pd = planets[p]
            if isinstance(pd, dict):
                d = (pd.get("dignity") or "").lower()
                if "exalted" in d or "own" in d:
                    s += 1.0
        return s

    v, pi, k = _dosha_score(vata_p), _dosha_score(pitta_p), _dosha_score(kapha_p)
    total = v + pi + k or 1.0
    vp, pp = round(v / total * 100), round(pi / total * 100)
    kp = 100 - vp - pp

    if vp >= pp and vp >= kp:
        dominant = "Vata"
    elif pp >= vp and pp >= kp:
        dominant = "Pitta"
    else:
        dominant = "Kapha"

    return {"vata": vp, "pitta": pp, "kapha": kp, "dominant": dominant}


# ═══════════════════════════════════════════════════════════════
# OVERALL SYNTHESIS
# ═══════════════════════════════════════════════════════════════

def _synthesize_overall(
    constitution: dict,
    indications: List[dict],
    tridosha: dict,
    dasha_info: dict,
) -> Tuple[str, str]:
    """Generate the master synthesis and dominant health theme."""
    sorted_inds = sorted(indications, key=lambda x: x["severity_score"], reverse=True)

    # Dominant theme
    themes: List[str] = []
    for ind in sorted_inds:
        if ind["severity"] in ("high", "elevated"):
            themes.append(f"{ind['domain']} (elevated)")
        elif ind["severity"] == "moderate":
            themes.append(f"{ind['domain']} (moderate)")
        elif ind["severity"] == "low":
            themes.append(f"{ind['domain']} (minor)")
    dominant_theme = " > ".join(themes[:3]) if themes else "Generally healthy constitution"

    # Build synthesis
    parts: List[str] = []
    parts.append(
        f"Overall constitution is {constitution['overall'].lower()} "
        f"with {tridosha['dominant']}-dominant Ayurvedic Prakriti."
    )

    elevated = [i for i in sorted_inds if i["severity"] in ("high", "elevated")]
    moderate = [i for i in sorted_inds if i["severity"] == "moderate"]
    protected = [i for i in sorted_inds if i["severity"] in ("negligible", "low")]

    if elevated:
        parts.append(f"Primary attention areas: {', '.join(i['domain'] for i in elevated[:2])}.")
    if moderate:
        parts.append(f"Secondary monitoring: {', '.join(i['domain'] for i in moderate[:2])}.")
    if protected:
        parts.append(f"Well-protected areas: {', '.join(i['domain'] for i in protected[:2])}.")

    active = [
        i for i in sorted_inds
        if i["activation"] in ("active", "partially_active")
        and i["severity"] in ("moderate", "elevated", "high")
    ]
    dormant_concerns = [
        i for i in sorted_inds
        if i["activation"] == "dormant"
        and i["severity"] in ("moderate", "elevated", "high")
    ]

    maha = (dasha_info.get("mahadasha") or "").capitalize()
    if active:
        parts.append(
            f"Currently activated ({maha} Mahadasha): "
            f"{', '.join(i['domain'] for i in active[:2])}."
        )
    if dormant_concerns:
        parts.append(
            f"Latent tendencies (dormant): "
            f"{', '.join(i['domain'] for i in dormant_concerns[:2])}."
        )

    return " ".join(parts), dominant_theme


# ═══════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════

def compute_health_evidence(chart_data: dict, computed: Optional[dict] = None) -> dict:
    """
    Main entry: compute the full Health Evidence Brief from chart_data.

    This is the Layer 2 reasoning engine. It takes raw chart facts and produces
    a fully synthesized, interaction-aware health assessment.
    """
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})

    # Step 1: structural maps
    aspect_map = _build_aspect_map(planets)
    conjunction_map = _build_conjunction_map(planets)
    benefics, malefics = _classify_benefic_malefic(planets)

    house_lords: Dict[str, str] = {}
    for h_key, h_data in houses.items():
        if isinstance(h_data, dict):
            lord = (h_data.get("lord") or "").lower()
            if lord:
                house_lords[h_key] = lord

    # Step 2: affliction scores for ALL planets
    affliction_scores: Dict[str, dict] = {}
    for p_name, p_data in planets.items():
        if not isinstance(p_data, dict):
            continue
        s, aff, prot = _compute_planet_affliction(
            p_name, p_data, planets, aspect_map, conjunction_map,
            benefics, malefics, house_lords,
        )
        affliction_scores[p_name] = {"score": s, "afflictions": aff, "protections": prot}

    # Step 3: dasha
    dasha_info = _extract_dasha_info(chart_data)

    # Step 4: assess every health domain
    indications: List[dict] = []
    for dk, dc in HEALTH_DOMAINS.items():
        result = _assess_domain(
            dk, dc, planets, houses, aspect_map, conjunction_map,
            affliction_scores, benefics, malefics, dasha_info,
        )
        if result:
            indications.append(result)

    indications.sort(key=lambda x: x["severity_score"], reverse=True)

    # Step 5: constitution
    constitution = _assess_constitution(planets, houses, affliction_scores, aspect_map, benefics)

    # Step 6: tridosha
    tridosha = _compute_tridosha(planets, computed)

    # Step 7: synthesis
    overall_synthesis, dominant_theme = _synthesize_overall(
        constitution, indications, tridosha, dasha_info,
    )

    # Step 8: protective factors
    protective_factors: List[str] = []
    for p_name, p_info in affliction_scores.items():
        if p_info["score"] < -1.0 and p_info["protections"]:
            protective_factors.extend(p_info["protections"][:1])
    protective_factors.extend(constitution.get("protections", []))

    return {
        "constitution": constitution,
        "tridosha": tridosha,
        "dasha": dasha_info,
        "indications": indications,
        "protective_factors": protective_factors[:6],
        "overall_synthesis": overall_synthesis,
        "dominant_theme": dominant_theme,
        "planet_scores": affliction_scores,
    }


# ═══════════════════════════════════════════════════════════════
# FORMAT EVIDENCE FOR LLM PROMPT
# ═══════════════════════════════════════════════════════════════

def format_evidence_for_prompt(evidence: dict) -> str:
    """
    Format the HealthEvidenceBrief as structured text for the LLM.

    The LLM receives this and writes prose. It does NOT re-interpret planets.
    """
    lines: List[str] = []

    lines.append("=" * 60)
    lines.append("HEALTH EVIDENCE BRIEF — PRE-COMPUTED BY REASONING ENGINE")
    lines.append("Write from these conclusions. Do NOT independently")
    lines.append("re-interpret planetary positions. All interactions,")
    lines.append("mitigations, and conflicts are already computed below.")
    lines.append("=" * 60)

    # ── Constitution ──
    c = evidence["constitution"]
    lines.append("")
    lines.append("[CONSTITUTION & VITALITY]")
    lines.append(f"Lagna (Ascendant): {c['lagna_sign']}")
    lines.append(f"Lagna Lord: {c['lagna_lord'].capitalize()} in House {c['lagna_lord_house']}")
    lines.append(f"Constitution Grade: {c['overall']}")
    for p in c.get("protections", []):
        lines.append(f"  ✓ {p}")

    # ── Tridosha ──
    t = evidence["tridosha"]
    lines.append("")
    lines.append("[TRIDOSHA BALANCE]")
    lines.append(f"Vata: {t['vata']}% | Pitta: {t['pitta']}% | Kapha: {t['kapha']}%")
    lines.append(f"Dominant Dosha: {t['dominant']}")

    # ── Dasha ──
    d = evidence["dasha"]
    lines.append("")
    lines.append("[ACTIVE DASHA TIMELINE]")
    maha_years = ""
    if d.get("mahadasha_start") and d.get("mahadasha_end"):
        maha_years = f" ({d['mahadasha_start'][:4]} to {d['mahadasha_end'][:4]})"
    lines.append(f"Mahadasha: {(d.get('mahadasha') or 'unknown').capitalize()}{maha_years}")
    if d.get("antardasha"):
        ad = ""
        if d.get("antardasha_start") and d.get("antardasha_end"):
            ad = f" ({d['antardasha_start']} to {d['antardasha_end']})"
        lines.append(f"Antardasha: {d['antardasha'].capitalize()}{ad}")

    # ── Health Indications ──
    lines.append("")
    lines.append("[HEALTH INDICATIONS — RANKED BY NET SEVERITY]")
    lines.append("(All interactions, mitigations, and dasha activation pre-computed)")
    lines.append("")

    for i, ind in enumerate(evidence["indications"], 1):
        act_label = {
            "active": "🔴 ACTIVE",
            "partially_active": "🟡 PARTIALLY ACTIVE",
            "dormant": "⚪ DORMANT",
        }.get(ind["activation"], "⚪ DORMANT")

        lines.append(f"--- {i}. {ind['emoji']} {ind['domain']} ---")
        lines.append(f"Severity: {ind['severity'].upper()} (score: {ind['severity_score']}) | Status: {act_label}")

        if ind["primary_causes"]:
            lines.append(f"Primary Factors: {'; '.join(ind['primary_causes'])}")
        if ind["aggravating_factors"]:
            lines.append(f"Aggravating: {'; '.join(ind['aggravating_factors'])}")
        if ind["mitigating_factors"]:
            lines.append(f"Mitigating: {'; '.join(ind['mitigating_factors'])}")

        lines.append(f"NET CONCLUSION: {ind['net_conclusion']}")
        lines.append("")

    # ── Protective Factors ──
    if evidence.get("protective_factors"):
        lines.append("[PROTECTIVE FACTORS]")
        for pf in evidence["protective_factors"]:
            lines.append(f"  ✓ {pf}")
        lines.append("")

    # ── Overall Synthesis ──
    lines.append("[OVERALL HEALTH SYNTHESIS]")
    lines.append(evidence["overall_synthesis"])
    lines.append("")
    lines.append(f"[DOMINANT THEME]: {evidence['dominant_theme']}")

    return "\n".join(lines)
