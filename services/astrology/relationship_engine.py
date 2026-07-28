"""
Vedic Relationship Analysis Engine — Multi-Target Relationship Intelligence.

Supports 9 relationship categories:
- Father (9th, 10th, 1st | Sun, Jupiter | Jaimini AK | Pitru Dosha)
- Mother (4th, 1st, 10th, 9th | Moon, Venus | Jaimini MK | D12 Dwadasamsha | Matru Yogas/Doshas)
- Siblings (3rd, 11th, 6th | Mars, Jupiter, Mercury | Jaimini BK | D3 Drekkana | Bhratri Yogas/Doshas)
- Spouse / Partner (7th, 2nd, 8th, 12th | Venus, Jupiter, Darakaraka | D9 Navamsa | Manglik)
- Children (5th, 9th | Jupiter, Sun | D7 Saptamsa | Putra Yogas)
- Friends (11th, 3rd | Mercury, Jupiter | Maitri Yogas)
- Boss / Authorities (10th, 6th, 9th | Sun, Saturn, Jupiter | D10 Dashamsha | Raj Yogas)
- Mentors / Teachers (9th, 5th | Jupiter, Sun | Guru Yogas)
- In-Laws (7th, 8th, 2nd | Venus, Jupiter | 8th Lord Status)
"""

from typing import Dict, Any, List, Optional


RELATIONSHIP_CONFIGS: Dict[str, Dict[str, Any]] = {
    "father": {
        "title": "Father (Pitr)",
        "icon": "👨‍🦳",
        "primary_houses": [9, 10, 1],
        "karakas": ["sun", "jupiter"],
        "divisional": "D12 Dwadasamsha",
        "check_doshas": ["pitru_dosha", "sun_affliction"],
        "focus_areas": [
            "Emotional Bond", "Respect & Guidance", "Father's Influence & Status",
            "Karmic Lessons", "Areas of Conflict", "Timeline & Harmonization"
        ]
    },
    "mother": {
        "title": "Mother (Matr)",
        "icon": "👩‍🦳",
        "primary_houses": [4, 1, 10, 9],
        "karakas": ["moon", "venus"],
        "divisional": "D12 Dwadasamsha",
        "check_doshas": ["moon_affliction", "matru_dosha"],
        "focus_areas": [
            "Emotional Nurturing & Bond", "Mother's Temperament & Health",
            "Home Peace & Early Upbringing", "Past-Life Karmic Connection",
            "Communication & Friction Triggers", "Maternal Support & Blessings"
        ]
    },
    "siblings": {
        "title": "Siblings (Bhratr)",
        "icon": "👦",
        "primary_houses": [3, 11, 6],
        "karakas": ["mars", "jupiter", "mercury"],
        "divisional": "D3 Drekkana",
        "check_doshas": ["bhratri_dosha", "mars_rahu_clash"],
        "focus_areas": [
            "Younger Siblings (3rd House & Mars)", "Elder Siblings (11th House & Jupiter)",
            "Cooperation vs Competition/Rivalry", "Shared Family Property & Wealth",
            "Communication Alignment", "Long-term Fraternal Bond"
        ]
    },
    "spouse": {
        "title": "Spouse / Partner (Kalatra)",
        "icon": "💍",
        "primary_houses": [7, 2, 8, 12],
        "karakas": ["venus", "jupiter"],
        "divisional": "D9 Navamsa",
        "check_doshas": ["manglik"],
        "focus_areas": [
            "Compatibility", "Communication", "Romance", "Trust",
            "Emotional Bond", "Physical Compatibility", "Marriage Stability",
            "Challenges", "Improvement"
        ]
    },
    "children": {
        "title": "Children (Santana)",
        "icon": "👶",
        "primary_houses": [5, 9],
        "karakas": ["jupiter", "sun"],
        "divisional": "D7 Saptamsa",
        "check_doshas": ["putra_dosha"],
        "focus_areas": [
            "Chances of Children", "Relationship with Children", "Parenting Style",
            "Child Success", "Emotional Bond", "Family Happiness"
        ]
    },
    "friends": {
        "title": "Friends (Maitri)",
        "icon": "🤝",
        "primary_houses": [11, 3],
        "karakas": ["mercury", "jupiter"],
        "divisional": None,
        "check_doshas": ["rahu_in_11"],
        "focus_areas": [
            "Social Circle", "Networking", "Loyal Friends",
            "Betrayal Tendencies", "Helpful Contacts"
        ]
    },
    "boss": {
        "title": "Boss & Authorities (Adhikari)",
        "icon": "👔",
        "primary_houses": [10, 6, 9],
        "karakas": ["sun", "saturn", "jupiter"],
        "divisional": "D10 Dashamsha",
        "check_doshas": ["sun_saturn_clash"],
        "focus_areas": [
            "Authority Relationships", "Workplace Respect", "Promotions",
            "Leadership", "Government Support", "Workplace Politics"
        ]
    },
    "mentors": {
        "title": "Mentors & Teachers (Guru)",
        "icon": "🧘",
        "primary_houses": [9, 5],
        "karakas": ["jupiter", "sun"],
        "divisional": None,
        "check_doshas": ["guru_chandal"],
        "focus_areas": [
            "Guidance", "Learning", "Spiritual Teachers",
            "Mentor Support", "Blessings"
        ]
    },
    "inlaws": {
        "title": "In-Laws (Kutumba)",
        "icon": "🏡",
        "primary_houses": [7, 8, 2],
        "karakas": ["venus", "jupiter"],
        "divisional": None,
        "check_doshas": ["8th_house_affliction"],
        "focus_areas": [
            "Family Acceptance", "Harmony", "Long-term Relations",
            "Possible Conflicts"
        ]
    }
}


def _calculate_jaimini_7_karakas(planets: dict) -> dict:
    """Calculate the 7 Jaimini Chara Karakas: AK, AmK, BK, MK, PK, GK, DK."""
    if not isinstance(planets, dict) or not planets:
        return {}

    seven = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"]
    p_degs = []
    for p_name in seven:
        p = planets.get(p_name) or planets.get(p_name.capitalize()) or {}
        if isinstance(p, dict):
            long_val = p.get("longitude") or p.get("deg") or p.get("degree") or 0.0
            sign_deg = float(long_val) % 30.0
            p_degs.append((sign_deg, p_name.capitalize()))

    if len(p_degs) < 2:
        return {}

    p_degs.sort(key=lambda x: x[0], reverse=True)
    karakas = {}
    labels = ["Atmakaraka (AK)", "Amatyakaraka (AmK)", "Bhratrikaraka (BK)", "Matrukaraka (MK)", "Putrakaraka (PK)", "Gnatikaraka (GK)", "Darakaraka (DK)"]
    for i, (deg, p_name) in enumerate(p_degs[:7]):
        if i < len(labels):
            karakas[labels[i]] = f"{p_name} ({deg:.2f}°)"
    return karakas


def analyze_relationship(chart_data: dict, relationship_type: str = "spouse") -> dict:
    """
    Computes a dedicated relationship package for the selected target.
    Calculates house & lord dignities, karakas, aspects, Yogas/Doshas, Jaimini karakas, and relationship score (0-100).
    """
    rel_type = relationship_type.lower()
    if rel_type not in RELATIONSHIP_CONFIGS:
        rel_type = "spouse"

    cfg = RELATIONSHIP_CONFIGS[rel_type]
    planets = chart_data.get("raw_positions") or chart_data.get("planets") or {}
    houses = chart_data.get("houses") or {}
    doshas = chart_data.get("doshas") or {}
    yogas = chart_data.get("yogas") or []

    # 1. Extract Primary House Details
    house_details = []
    primary_lords = []
    house_score_mod = 0

    for h_num in cfg["primary_houses"]:
        h_str = str(h_num)
        h_info = houses.get(h_str, {})
        sign = h_info.get("sign", "Unknown")
        lord = h_info.get("lord", "").lower()
        if lord:
            primary_lords.append(lord)

        # Planets residing in house
        planets_in_h = [
            p_name for p_name, p in planets.items()
            if str(p.get("house")) == h_str
        ]

        # Check house affliction
        malefic_count = sum(1 for p in planets_in_h if p.lower() in ["saturn", "rahu", "ketu", "mars"])
        benefic_count = sum(1 for p in planets_in_h if p.lower() in ["jupiter", "venus", "mercury", "moon"])
        house_score_mod += (benefic_count * 5) - (malefic_count * 4)

        house_details.append({
            "house": h_num,
            "sign": sign,
            "lord": lord.capitalize(),
            "planets_in_house": [p.capitalize() for p in planets_in_h]
        })

    # 2. Extract Primary Karaka Details
    karaka_details = []
    karaka_score_mod = 0

    for k_name in cfg["karakas"]:
        k_data = planets.get(k_name.lower()) or planets.get(k_name.capitalize()) or {}
        if k_data:
            sign = k_data.get("sign", "?")
            house = k_data.get("house", "?")
            dignity = k_data.get("dignity", "neutral")
            is_retro = k_data.get("retrograde", False)
            is_combust = k_data.get("combust", False)

            if dignity in ["exalted", "own"]:
                karaka_score_mod += 12
            elif dignity == "debilitated":
                karaka_score_mod -= 12

            if is_combust:
                karaka_score_mod -= 8
            if is_retro:
                karaka_score_mod -= 4

            karaka_details.append({
                "planet": k_name.capitalize(),
                "sign": sign,
                "house": house,
                "dignity": dignity,
                "retrograde": is_retro,
                "combust": is_combust,
            })

    # 3. Check Deep Target-Specific Classical Doshas & Yogas
    active_doshas = []
    if rel_type == "spouse":
        manglik = doshas.get("manglik", {})
        if manglik.get("is_present"):
            active_doshas.append("Manglik Dosha (Mars in 7th/8th/12th/4th/1st)")
            karaka_score_mod -= 10
        else:
            active_doshas.append("Non-Manglik (No major Mars martial affliction)")

        saturn_p = planets.get("saturn", {}) or planets.get("Saturn", {})
        if str(saturn_p.get("house")) == "7":
            active_doshas.append("Saturn in 7th House: Pragmatic/mature spouse, delayed marriage timing, heavy karmic lessons")

    elif rel_type == "mother":
        moon_p = planets.get("moon", {}) or planets.get("Moon", {})
        h4_info = houses.get("4", {})
        h4_lord = h4_info.get("lord", "").lower()
        h4_lord_p = planets.get(h4_lord, {})

        moon_house = moon_p.get("house")
        h4_planets = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == "4"]

        # Check specific planets residing in 4th house (Matru Bhava)
        if "Mars" in h4_planets:
            active_doshas.append("Mars in 4th House (Matru/Bhoomi Klesha): Fiery friction; native's temper or impulsive choices inadvertently cause emotional/health strain to mother")
            karaka_score_mod -= 8
        if "Saturn" in h4_planets:
            active_doshas.append("Saturn in 4th House (Matru Karshya): Emotional restraint, early emotional isolation, or mother bearing heavy domestic hardship")
            karaka_score_mod -= 7
        if "Rahu" in h4_planets:
            active_doshas.append("Rahu in 4th House (Matru Rina): Unconventional bond, native's decisions creating unforeseen anxiety/worry for mother, past-life karmic debt")
            karaka_score_mod -= 7
        if "Ketu" in h4_planets:
            active_doshas.append("Ketu in 4th House: Emotional detachment or feeling disconnected from maternal/domestic roots")
            karaka_score_mod -= 6
        if "Sun" in h4_planets:
            active_doshas.append("Sun in 4th House: Ego clashes with mother or dominant maternal personality")
            karaka_score_mod -= 4

        # Benefics in 4th
        if any(b in h4_planets for b in ["Jupiter", "Venus", "Moon", "Mercury"]):
            active_doshas.append("Benefic in 4th House (Matru Sukha Yoga): Mother is a source of wisdom, protection, emotional prosperity, and blessings")
            karaka_score_mod += 10

        # Check Moon conjunctions
        moon_conj = [
            p_name.capitalize() for p_name, p in planets.items()
            if p_name.lower() != "moon" and p.get("house") == moon_house
        ]

        if any(m in [c.lower() for c in moon_conj] for m in ["rahu", "ketu"]):
            active_doshas.append("Chandra-Rahu/Ketu Affliction: Emotional distance / mother's health anxiety")
            karaka_score_mod -= 8
        if "Saturn" in moon_conj:
            active_doshas.append("Punarfoo / Shani-Chandra: Emotional restraint & heavy responsibilities on mother")
            karaka_score_mod -= 6
        if "Mars" in moon_conj:
            active_doshas.append("Chandra-Mangal Yoga: Fiery dynamics & strong-willed maternal temperament")

        if moon_house in [6, 8, 12]:
            active_doshas.append(f"Moon in House {moon_house} (Dusthana): Sensitive maternal health or physical distance")
            karaka_score_mod -= 8

        if h4_lord_p and h4_lord_p.get("house") in [6, 8, 12]:
            active_doshas.append(f"4th Lord ({h4_lord.capitalize()}) in House {h4_lord_p.get('house')}: Matru Bhava lord in Dusthana (Maternal challenges/distance)")
            karaka_score_mod -= 6

    elif rel_type == "siblings":
        mars_p = planets.get("mars", {}) or planets.get("Mars", {})
        h3_info = houses.get("3", {})
        h11_info = houses.get("11", {})
        h3_lord = h3_info.get("lord", "").lower()
        h11_lord = h11_info.get("lord", "").lower()
        h3_lord_p = planets.get(h3_lord, {})
        h11_lord_p = planets.get(h11_lord, {})

        h3_planets = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == "3"]
        h11_planets = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == "11"]

        if "Mars" in h3_planets or "Mars" in h11_planets:
            active_doshas.append("Mars in Bhratri Bhava: High energy, competitive drive with siblings, risk of property disputes")

        if "Rahu" in h3_planets or "Rahu" in h11_planets or (mars_p.get("house") and any(p.get("house") == mars_p.get("house") for p_name, p in planets.items() if p_name.lower() == "rahu")):
            active_doshas.append("Angarak Bhratri Friction: Rahu/Mars influence on 3rd/11th houses causing competitive rivalry or sudden friction")
            karaka_score_mod -= 6

        if "Saturn" in h3_planets:
            active_doshas.append("Saturn in 3rd House: Age gap, formal relationship, or heavy responsibility towards younger siblings")
        if "Saturn" in h11_planets:
            active_doshas.append("Saturn in 11th House: Reserved bond or delayed closeness with elder siblings")

        if any(b in h3_planets or b in h11_planets for b in ["Jupiter", "Venus"]):
            active_doshas.append("Benefic in 3rd/11th (Bhratri Vriddhi Yoga): Supportive siblings who bring mutual financial/emotional elevation")
            karaka_score_mod += 8

        if h3_lord_p and h3_lord_p.get("house") in [6, 8, 12]:
            active_doshas.append(f"3rd Lord ({h3_lord.capitalize()}) in House {h3_lord_p.get('house')}: Younger sibling vulnerability/distance")
            karaka_score_mod -= 5
        if h11_lord_p and h11_lord_p.get("house") in [6, 8, 12]:
            active_doshas.append(f"11th Lord ({h11_lord.capitalize()}) in House {h11_lord_p.get('house')}: Elder sibling vulnerability/distance")
            karaka_score_mod -= 5

    elif rel_type == "father":
        sun_p = planets.get("sun", {}) or planets.get("Sun", {})
        h9_info = houses.get("9", {})
        h9_planets = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == "9"]

        if sun_p.get("house") in [8, 12] or sun_p.get("dignity") == "debilitated":
            active_doshas.append("Pitru Affirmation: Sun weakened or in dusthana (Ideological clashes or distance from father)")
            karaka_score_mod -= 8
        if "Saturn" in h9_planets or "Rahu" in h9_planets:
            active_doshas.append("Saturn/Rahu in 9th House (Pitru Rina): Strict father figure, high expectations, or heavy paternal karma")
            karaka_score_mod -= 6

    elif rel_type == "children":
        jup_p = planets.get("jupiter", {}) or planets.get("Jupiter", {})
        h5_planets = [p_name.capitalize() for p_name, p in planets.items() if str(p.get("house")) == "5"]

        if jup_p.get("house") in [6, 8, 12]:
            active_doshas.append("Santana Caution: Jupiter in 6th/8th/12th (Parenting lessons/child health attention)")
            karaka_score_mod -= 6
        if any(m in h5_planets for m in ["Rahu", "Ketu", "Saturn"]):
            active_doshas.append("Malefic in 5th House: Unconventional child development or delayed parenting timing")

    # Relevant Yogas
    rel_yogas = [
        y.get("name") for y in yogas
        if any(w in y.get("name", "").lower() for w in ["raj", "dhana", "gaja", "shubha", "vivah", "guru"])
    ]
    if rel_yogas:
        karaka_score_mod += min(len(rel_yogas) * 4, 12)

    # 4. Calculate Deterministic Relationship Score (0 to 100)
    base_score = 65
    raw_score = base_score + house_score_mod + karaka_score_mod
    final_score = max(25, min(96, raw_score))

    # Calculate Jaimini Karakas
    jaimini_map = _calculate_jaimini_7_karakas(planets)

    return {
        "target": rel_type,
        "title": cfg["title"],
        "icon": cfg["icon"],
        "score": final_score,
        "houses": house_details,
        "karakas": karaka_details,
        "jaimini_karakas": jaimini_map,
        "divisional": cfg["divisional"],
        "doshas": active_doshas,
        "yogas": rel_yogas[:4],
        "focus_areas": cfg["focus_areas"],
    }


def format_relationship_subset_context(analysis: dict, profile: dict = None, history: list = None) -> str:
    """
    Formats ONLY the relevant astrological subset for the chosen relationship target.
    Eliminates token bloat while providing rich target data.
    """
    target = analysis.get("target", "spouse")
    title = analysis.get("title", "Relationship")
    score = analysis.get("score", 70)
    houses = analysis.get("houses", [])
    karakas = analysis.get("karakas", [])
    jaimini_karakas = analysis.get("jaimini_karakas", {})
    doshas = analysis.get("doshas", [])
    yogas = analysis.get("yogas", [])
    divisional = analysis.get("divisional")

    # Format house subset block
    house_lines = []
    for h in houses:
        planets_str = f" containing [{', '.join(h['planets_in_house'])}]" if h['planets_in_house'] else " (Vacant)"
        house_lines.append(f"- {h['house']}th House: Sign {h['sign']} | Lord: {h['lord']}{planets_str}")

    # Format karaka subset block
    karaka_lines = []
    for k in karakas:
        status_parts = []
        if k["retrograde"]:
            status_parts.append("Retrograde [R]")
        if k["combust"]:
            status_parts.append("Combust")
        status_parts.append(f"Dignity: {k['dignity']}")

        karaka_lines.append(
            f"- {k['planet']}: In {k['sign']} (House {k['house']}) — {', '.join(status_parts)}"
        )

    # Format Jaimini karaka info for target
    jaimini_lines = []
    if target == "mother" and "Matrukaraka (MK)" in jaimini_karakas:
        jaimini_lines.append(f"- Matrukaraka (MK): {jaimini_karakas['Matrukaraka (MK)']}")
    elif target == "siblings" and "Bhratrikaraka (BK)" in jaimini_karakas:
        jaimini_lines.append(f"- Bhratrikaraka (BK): {jaimini_karakas['Bhratrikaraka (BK)']}")
    elif target == "spouse" and "Darakaraka (DK)" in jaimini_karakas:
        jaimini_lines.append(f"- Darakaraka (DK): {jaimini_karakas['Darakaraka (DK)']}")
    elif target == "father" and "Atmakaraka (AK)" in jaimini_karakas:
        jaimini_lines.append(f"- Atmakaraka (AK): {jaimini_karakas['Atmakaraka (AK)']}")
    elif target == "children" and "Putrakaraka (PK)" in jaimini_karakas:
        jaimini_lines.append(f"- Putrakaraka (PK): {jaimini_karakas['Putrakaraka (PK)']}")

    name = profile.get("name", "Seeker") if profile else "Seeker"

    return f"""[RELATIONSHIP TARGET DATA: {title.upper()}]
Subject Name: {name}

[PRIMARY HOUSES FOR {title.upper()}]
{chr(10).join(house_lines)}

[PRIMARY KARAKA PLANETS]
{chr(10).join(karaka_lines) if karaka_lines else "Standard Karaka planetary alignment."}

[JAIMINI CHARA KARAKA FOR TARGET]
{chr(10).join(jaimini_lines) if jaimini_lines else "- Standard Jaimini Karaka alignment."}

[DIVISIONAL CHART SUPPORT]
{f"Chart: {divisional} active indicators." if divisional else "D1 Lagna primary indicators."}

[CLASSICAL DOSHAS, AFFLICTIONS & YOGAS]
{chr(10).join(f"- {d}" for d in doshas) if doshas else "- No severe target-specific afflictions detected."}

[SUPPORTIVE YOGAS]
{chr(10).join(f"- {y}" for y in yogas) if yogas else "- Standard benefic yogas."}"""
