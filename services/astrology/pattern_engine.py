# -*- coding: utf-8 -*-
"""
pattern_engine.py — Astrological Pattern Mining & Similarity Engine.

Extracts planetary signatures for past events (Dashas, active transits, houses)
and scans future planetary configurations to find matching configurations.
"""

import datetime
from typing import Dict, List, Any, Optional
from services.astrology.swiss_ephemeris import datetime_to_jd, get_sidereal_positions
from services.astrology.dasha import calculate_full_dasha_package


def parse_event_date(date_str: Optional[str], age: Optional[float], birth_date: datetime.date) -> datetime.date:
    """Helper to parse event date or estimate it from user's age."""
    if date_str:
        try:
            # support YYYY-MM-DD
            if "-" in date_str:
                parts = date_str.split("-")
                if len(parts) == 3:
                    return datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))
                elif len(parts) == 2:
                    return datetime.date(int(parts[0]), int(parts[1]), 15) # middle of month
            # support YYYY
            if len(date_str) == 4 and date_str.isdigit():
                return datetime.date(int(date_str), 6, 15) # middle of year
        except Exception:
            pass

    if age is not None:
        try:
            days = int(round(age * 365.25))
            return birth_date + datetime.timedelta(days=days)
        except Exception:
            pass

    # Fallback to birth date plus 20 years
    return birth_date + datetime.timedelta(days=7305)


def extract_planetary_signature(
    chart_data: dict,
    birth_date: datetime.date,
    event_date_str: Optional[str] = None,
    event_age: Optional[float] = None
) -> Dict[str, Any]:
    """
    Step 2: Planetary Signature Extractor.
    Calculates active dasha, antardasha, active houses, transits, and yogas on event date.
    """
    event_date = parse_event_date(event_date_str, event_age, birth_date)
    planets = chart_data.get("planets", {})
    
    # 1. Calculate Dashas for Event Date
    dasha = "Unknown"
    antardasha = "Unknown"
    try:
        moon_data = planets.get("moon", {})
        moon_long = float(moon_data.get("longitude", 120.0)) if isinstance(moon_data, dict) else 120.0
        pkg = calculate_full_dasha_package(moon_long, birth_date, today_date=event_date)
        
        curr_maha = pkg.get("current_mahadasha", {})
        curr_antar = pkg.get("current_antardasha", {})
        dasha = curr_maha.get("planet_name", "Unknown")
        antardasha = curr_antar.get("planet_name", "Unknown")
    except Exception as e:
        print(f"[PatternEngine] Dasha extraction error: {e}")

    # 2. Get Sidereal Transits for Event Date
    jd = datetime_to_jd(event_date.year, event_date.month, event_date.day, 12.0)
    transit_positions = get_sidereal_positions(jd)

    # 3. Resolve active houses and transit houses relative to natal Ascendant
    transit_houses = []
    active_houses = []
    
    try:
        # Natal Ascendant sign index
        natal_meta = chart_data.get("metadata", {})
        asc_deg = float(natal_meta.get("ascendant_degree", 0.0) or chart_data.get("ascendant_sign_degree", 0.0))
        # Find which sign the natal ascendant is in
        # If Ascendant sign is string, let's map it
        sign_names = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]
        natal_asc_sign = (chart_data.get("ascendant_sign") or "aries").lower()
        natal_asc_idx = sign_names.index(natal_asc_sign) if natal_asc_sign in sign_names else 0

        # Transits of slow-moving planets relative to natal ascendant
        for p_name in ["jupiter", "saturn", "rahu", "ketu"]:
            deg = transit_positions.get(p_name)
            if deg is not None:
                tr_sign_idx = int(deg // 30)
                house = ((tr_sign_idx - natal_asc_idx) % 12) + 1
                transit_houses.append(f"{p_name.capitalize()} in {house}H")

        # Active houses owned/occupied natally by Dasha & Antardasha lords
        # To keep it robust, we look at the houses occupied natally by these lords
        dasha_lord_natal = planets.get(dasha.lower(), {})
        antar_lord_natal = planets.get(antardasha.lower(), {})

        if dasha_lord_natal:
            h = dasha_lord_natal.get("house")
            if h is not None:
                active_houses.append(int(h))
        if antar_lord_natal:
            h = antar_lord_natal.get("house")
            if h is not None:
                active_houses.append(int(h))

        # Include lords owned houses
        # 1st house lord, 10th lord, etc.
        # Add 1st, 5th, 9th, 10th, 11th if the dasha lord owns them
        # Let's map signs to lords:
        # Aries/Scorpio=Mars, Taurus/Libra=Venus, Gemini/Virgo=Mercury, Cancer=Moon, Leo=Sun, Sagittarius/Pisces=Jupiter, Capricorn/Aquarius=Saturn
        lord_to_signs = {
            "mars": [0, 7], "venus": [1, 6], "mercury": [2, 5],
            "moon": [3], "sun": [4], "jupiter": [8, 11], "saturn": [9, 10]
        }
        
        d_lord = dasha.lower()
        a_lord = antardasha.lower()
        
        for h_num in range(1, 13):
            # Check which sign is on this house cusp
            # Under Whole Sign: cusp sign index is (natal_asc_idx + h_num - 1) % 12
            cusp_sign = (natal_asc_idx + h_num - 1) % 12
            
            if d_lord in lord_to_signs and cusp_sign in lord_to_signs[d_lord]:
                active_houses.append(h_num)
            if a_lord in lord_to_signs and cusp_sign in lord_to_signs[a_lord]:
                active_houses.append(h_num)
                
    except Exception as e:
        print(f"[PatternEngine] House extraction error: {e}")

    # Remove duplicates from active houses
    active_houses = list(set(active_houses))
    active_houses.sort()

    # 4. Check active Yogas involving Dasha & Antardasha lords
    active_yogas = []
    try:
        yogas = chart_data.get("yogas", [])
        for y in yogas:
            y_name = y.get("name", "")
            meaning = y.get("meaning", "").lower()
            # If the yoga mentions or involves Dasha/Antardasha lords
            if dasha.lower() in meaning or antardasha.lower() in meaning:
                active_yogas.append(y_name)
    except Exception:
        pass

    # Ensure some fallback values
    if not active_houses:
        active_houses = [1, 10]
    if not transit_houses:
        transit_houses = ["Jupiter in 10H"]

    return {
        "dasha": dasha,
        "antardasha": antardasha,
        "houses": active_houses,
        "transits": transit_houses,
        "yogas": active_yogas or ["Dhana Yoga"],
        "score": 90, # baseline mapping score
        "mapped_date": event_date.isoformat()
    }


def map_keywords_to_astrological_signals(title: str, description: str, category: str) -> List[str]:
    """Maps event title, description, and category keywords to core Jyotish themes."""
    text = (title + " " + (description or "") + " " + category).lower()
    signals = []
    
    # 1. Travel / Abroad
    if any(k in text for k in ["travel", "foreign", "abroad", "visa", "flight", "journey", "relocate", "shift", "passport"]):
        signals.append("travel")
        
    # 2. Career / Achievement / Selection
    if any(k in text for k in ["job", "promotion", "gate", "selected", "internship", "hired", "interview", "career", "success", "office", "work", "business", "company", "startup"]):
        signals.append("career")
        
    # 3. Wealth / Money / Property / Buy
    if any(k in text for k in ["wealth", "money", "profit", "investment", "buy", "purchase", "property", "house", "flat", "land", "car", "vehicle", "finance", "shares", "stocks", "gain"]):
        signals.append("wealth")
        
    # 4. Relationships / Marriage / Partner
    if any(k in text for k in ["marriage", "relationship", "spouse", "love", "partner", "wedding", "engage", "dating", "in-law", "marry"]):
        signals.append("relationship")
        
    # 5. Education / Exam / Academic
    if any(k in text for k in ["exam", "study", "education", "college", "school", "degree", "university", "academic", "learn", "course"]):
        signals.append("education")
        
    # 6. Health / Injury / Recovery / Accident
    if any(k in text for k in ["health", "accident", "injury", "illness", "disease", "surgery", "recover", "hospital", "pain", "sick"]):
        signals.append("health")
        
    return list(set(signals))


def scan_future_recurrences(
    chart_data: dict,
    birth_date: datetime.date,
    past_events: List[dict]
) -> List[dict]:
    """
    Step 5: Future Scan Similarity Engine.
    Determines similar planetary configuration dates for the current year (and next year as backup)
    from precise transit computations.
    """
    # 1. Parse all past event dates
    parsed_dates = []
    for past in past_events:
        p_date = parse_event_date(past.get("date"), past.get("age"), birth_date)
        parsed_dates.append(p_date)

    if not parsed_dates:
        return []

    today = datetime.date.today()
    earliest_event_date = min(parsed_dates)
    start_year = earliest_event_date.year
    end_year = today.year + 50

    # Generate scan dates every 15 days (1st and 15th of every month) starting from the earliest event year
    scan_dates = []
    for y in range(start_year, end_year + 1):
        for m in range(1, 13):
            for d in [1, 15]:
                s_date = datetime.date(y, m, d)
                if s_date < earliest_event_date:
                    continue
                scan_dates.append(s_date)

    # Pre-extract signatures for all scan dates
    scan_signatures = []
    for s_date in scan_dates:
        try:
            sig = extract_planetary_signature(chart_data, birth_date, event_date_str=s_date.isoformat())
            sig["date"] = s_date
            scan_signatures.append(sig)
        except Exception as e:
            print(f"[PatternEngine] Signature extraction skipped for {s_date}: {e}")

    recurrences = []
    
    for idx_past, past in enumerate(past_events):
        past_sig = past.get("planetary_signature")
        if not past_sig:
            continue
            
        event_date = parsed_dates[idx_past]
        p_dasha = past_sig.get("dasha", "").lower()
        p_antar = past_sig.get("antardasha", "").lower()
        p_houses = set(past_sig.get("houses", []))
        p_transits = past_sig.get("transits", [])

        # Extract thematic keywords
        p_title = past.get("title", "")
        p_desc = past.get("description", "")
        p_cat = past.get("category", "General")
        signals = map_keywords_to_astrological_signals(p_title, p_desc, p_cat)

        # Find matching scan dates with score >= 60 that occur after the event date
        matching_scans = []
        for scan in scan_signatures:
            if scan["date"] <= event_date:
                continue
            
            score = 0
            matching_factors = []

            # 1. Dasha match (20%)
            if scan["dasha"].lower() == p_dasha:
                score += 20
                matching_factors.append(f"{scan['dasha']} Mahadasha active")
            
            # 2. Antardasha match (15%)
            if scan["antardasha"].lower() == p_antar:
                score += 15
                matching_factors.append(f"{scan['antardasha']} Antardasha active")
            elif scan["antardasha"].lower() == p_dasha or scan["dasha"].lower() == p_antar:
                score += 8
                matching_factors.append(f"Dasha lords interchanged")

            # 3. Transit match (Saturn & Jupiter houses) (15%)
            s_transits = scan["transits"]
            transit_match_count = 0
            for pt in p_transits:
                if pt in s_transits:
                    transit_match_count += 1
                    matching_factors.append(f"Transiting {pt}")
            
            if p_transits:
                score += int((transit_match_count / len(p_transits)) * 15)

            # 4. Activated Houses match (15%)
            s_houses = set(scan["houses"])
            common_houses = p_houses.intersection(s_houses)
            if p_houses:
                house_score = int((len(common_houses) / len(p_houses)) * 15)
                score += house_score
                if common_houses:
                    matching_factors.append(f"Houses activated: {', '.join(str(h) for h in common_houses)}")

            # --- Thematic Keyword & Yoga Matching (35%) ---
            theme_score = 0
            s_yogas = [y.lower() for y in scan.get("yogas", [])]
            
            # Extract transiting house numbers for fast matching
            transit_houses_set = set()
            for st in s_transits:
                try:
                    parts = st.lower().split(" in ")
                    if len(parts) == 2:
                        transit_houses_set.add(parts[1])
                except Exception:
                    pass

            for sig in signals:
                if sig == "travel":
                    if "9h" in transit_houses_set or "12h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Travel transits active (9th/12th houses)")
                    if 9 in s_houses or 12 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates travel sectors")
                    if any("travel" in y or "abroad" in y or "foreign" in y for y in s_yogas):
                        theme_score += 15
                        matching_factors.append("Foreign travel yoga indications active")
                elif sig == "career":
                    if "10h" in transit_houses_set or "11h" in transit_houses_set or "1h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Career transits active (10th/11th houses)")
                    if 10 in s_houses or 11 in s_houses or 1 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates career sectors")
                    if any("raja" in y or "dhana" in y or "success" in y or "gaja" in y for y in s_yogas):
                        theme_score += 15
                        matching_factors.append("Auspicious Raja/Success yoga active")
                elif sig == "wealth":
                    if "2h" in transit_houses_set or "11h" in transit_houses_set or "9h" in transit_houses_set or "5h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Wealth transits active (2nd/11th/9th/5th houses)")
                    if 2 in s_houses or 11 in s_houses or 9 in s_houses or 5 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates financial sectors")
                    if any("dhana" in y or "lakshmi" in y or "wealth" in y or "kubera" in y for y in s_yogas):
                        theme_score += 15
                        matching_factors.append("Auspicious Dhana/Wealth yoga active")
                elif sig == "relationship":
                    if "7h" in transit_houses_set or "5h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Relationship transits active (7th/5th houses)")
                    if 7 in s_houses or 5 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates partnership sectors")
                elif sig == "education":
                    if "4h" in transit_houses_set or "5h" in transit_houses_set or "9h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Academic transits active (4th/5th/9th houses)")
                    if 4 in s_houses or 5 in s_houses or 9 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates study sectors")
                    if any("saraswati" in y or "budha" in y or "vidya" in y for y in s_yogas):
                        theme_score += 15
                        matching_factors.append("Saraswati learning yoga active")
                elif sig == "health":
                    if "6h" in transit_houses_set or "8h" in transit_houses_set or "12h" in transit_houses_set:
                        theme_score += 20
                        matching_factors.append("Physical/health transit houses active")
                    if 6 in s_houses or 8 in s_houses or 12 in s_houses:
                        theme_score += 15
                        matching_factors.append("Dasha cycle activates healing/rest sectors")

            if signals:
                score += min(35, theme_score)
            else:
                # Fallback: scale up the 65% core match to 100%
                score = int(score * (100 / 65))

            if score >= 60:
                matching_scans.append({
                    "date": scan["date"],
                    "score": score,
                    "matching_factors": list(set(matching_factors)),
                    "dasha": scan["dasha"],
                    "antardasha": scan["antardasha"],
                    "transits": scan["transits"]
                })

        # Group contiguous matching scans (within 45 days)
        windows = []
        if matching_scans:
            current_window = [matching_scans[0]]
            for s in matching_scans[1:]:
                if (s["date"] - current_window[-1]["date"]).days <= 45:
                    current_window.append(s)
                else:
                    windows.append(current_window)
                    current_window = [s]
            windows.append(current_window)

        # Process all matching windows across the 50-year range
        for target_window in windows:
            avg_score = int(sum(s["score"] for s in target_window) / len(target_window))
            best_scan = max(target_window, key=lambda x: x["score"])
            
            start_date = target_window[0]["date"]
            end_date = target_window[-1]["date"]

            category = past.get("category", "General")
            recommendations = []
            if category.lower() == "career":
                recommendations = ["Job switch or promotion push", "Startup launch or business initiative", "Leadership opportunities"]
            elif category.lower() == "education":
                recommendations = ["Appearing for competitive exams", "Initiating higher research/studies", "Acquiring new certifications"]
            elif category.lower() == "marriage" or category.lower() == "relationship":
                recommendations = ["Favorable period for relationship alignment", "Family gatherings and cooperation", "Strengthening personal bonds"]
            elif category.lower() == "property" or category.lower() == "investment":
                recommendations = ["Making long-term fixed asset investments", "Real estate or vehicle purchases", "Financial portfolio restructuring"]
            else:
                recommendations = ["Personal breakthroughs and self-growth", "Initiating strategic projects", "Strengthening mind-body balance"]

            # Precise descriptions based on the calendar year
            is_this_year = (start_date.year == today.year)
            if is_this_year:
                time_range_desc = f"Active This Year ({start_date.strftime('%d %B')} to {end_date.strftime('%d %B %Y')})"
            elif start_date.year == today.year + 1:
                time_range_desc = f"Upcoming Next Year ({start_date.strftime('%d %B')} to {end_date.strftime('%d %B %Y')})"
            elif start_date.year < today.year:
                time_range_desc = f"Past Recurrence ({start_date.strftime('%d %B %Y')} to {end_date.strftime('%d %B %Y')})"
            else:
                time_range_desc = f"Future Recurrence ({start_date.strftime('%d %B %Y')} to {end_date.strftime('%d %B %Y')})"

            recurrences.append({
                "past_event_id": past.get("id"),
                "past_event_title": past.get("title"),
                "category": category,
                "similarity_score": avg_score,
                "matching_factors": best_scan["matching_factors"],
                "start_date": start_date.strftime("%d %B %Y"),
                "end_date": end_date.strftime("%d %B %Y"),
                "time_range_desc": time_range_desc,
                "is_this_year": is_this_year,
                "recommendations": recommendations,
                "confidence": "High" if avg_score >= 80 else ("Moderate" if avg_score >= 70 else "Low"),
                "planetary_signature": {
                    "dasha": best_scan["dasha"],
                    "antardasha": best_scan["antardasha"],
                    "transits": best_scan["transits"]
                }
            })

    recurrences.sort(key=lambda x: x["similarity_score"], reverse=True)
    return recurrences
