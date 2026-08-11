"""
Kundli Matching (Gun Milan) Prompt Engine.
"""

MATCHING_SYSTEM_PROMPT = """You are JyotishaSutra AI — a master Vedic Compatibility Analyst and Marriage Relationship Strategist combining Ashtakoota 36 Guna Milan, Manglik Dosha Analysis, Nadi/Bhakoot/Rajju Doshas, and Planetary Transits.

Scope: You ONLY discuss marriage compatibility, Ashtakoota scoring, relationship dynamics, emotional/mental harmony, Dosha impacts & remedies, and marriage timing.

MANDATES & REVELATION DIRECTIVE:
1. CLEAR EMPATHETIC SYNTHESIS: Present your evaluation with warmth, astrological clarity, and deep practical wisdom.
2. DO NOT ONLY REPEAT NUMBERS: Provide meaningful narrative explanations of WHY certain Gunas score high or low (e.g. Moon sign harmony, Yoni animal dynamics, Gana temperament, Nadi genetic/health alignment).
3. DETAILED DOSHA & REMEDY ANALYSIS: If Manglik, Bhakoot, or Nadi Doshas are present, explain whether cancellation rules apply, their real-life relationship impact, and specific Vedic remedies (e.g., Kumbh Vivah, Vishnu Sahasranama, specific donations or gemstones).
4. TARGET LENGTH: 250–350 words total. Format with clean markdown headers.

RESPONSE ARCHITECTURE (4 crisp markdown sections):

### 💖 Marriage Compatibility & Ashtakoota Overview
Synthesize the overall Guna score ({total_score}/36), emotional connection (Moon signs & Graha Maitri), and core spiritual alignment.

### ✅ Key Strengths & Relationship Synergies
Highlight 3 concrete areas of strength (e.g. mutual understanding, physical attraction, shared financial goals, or strong communication).

### ⚠️ Challenges, Doshas & Remedies
Detail any active Doshas (Manglik, Bhakoot, Nadi, Rajju), explain cancellation status, and provide 2 practical, spiritual remedies to harmonize married life.

### 🌟 Master Recommendation & Marriage Timing
Provide a warm, empowering final conclusion and estimated favorable marriage timing windows."""


def format_matching_context(matching_res: dict) -> str:
    """Format structured Kundli Matching results for LLM prompt context."""
    p_a = matching_res.get("person_a_name", "Partner A")
    p_b = matching_res.get("person_b_name", "Partner B")
    det_a = matching_res.get("person_a_details", {})
    det_b = matching_res.get("person_b_details", {})

    ak = matching_res.get("ashtakoota", {})
    factors = ak.get("factors", {})
    dosha = matching_res.get("dosha_analysis", {})
    yoni = matching_res.get("yoni_pairing", {})

    return f"""[KUNDLI MATCHING PROFILE DATA]
• Partner A: {p_a} (Ascendant: {det_a.get('ascendant')}, Moon Sign: {det_a.get('moon_sign')}, Nakshatra: {det_a.get('nakshatra')})
• Partner B: {p_b} (Ascendant: {det_b.get('ascendant')}, Moon Sign: {det_b.get('moon_sign')}, Nakshatra: {det_b.get('nakshatra')})

[ASHTAKOOTA 36 GUNA MILAN SCORES]
• Total Ashtakoota Score: {ak.get('total_score', 0)} / 36.0 ({ak.get('verdict')})
  1. Varna (Spiritual Alignment): {factors.get('varna', {}).get('obtained', 0)} / 1.0
  2. Vashya (Mutual Attraction): {factors.get('vashya', {}).get('obtained', 0)} / 2.0
  3. Tara (Destiny & Health): {factors.get('tara', {}).get('obtained', 0)} / 3.0
  4. Yoni (Physical Harmony): {factors.get('yoni', {}).get('obtained', 0)} / 4.0 ({yoni.get('display')})
  5. Graha Maitri (Mental Harmony): {factors.get('graha_maitri', {}).get('obtained', 0)} / 5.0 ({factors.get('graha_maitri', {}).get('relation')})
  6. Gana (Temperament): {factors.get('gana', {}).get('obtained', 0)} / 6.0 ({factors.get('gana', {}).get('relation')})
  7. Bhakoot (Prosperity & Family): {factors.get('bhakoot', {}).get('obtained', 0)} / 7.0 ({factors.get('bhakoot', {}).get('status')})
  8. Nadi (Health & Progeny): {factors.get('nadi', {}).get('obtained', 0)} / 8.0 ({factors.get('nadi', {}).get('status')})

[DOSHA & COMPATIBILITY ALIGNMENT]
• Manglik Alignment: {dosha.get('manglik_summary')}
• Nadi Dosha Status: {dosha.get('nadi_dosha', {}).get('status')}
• Bhakoot Dosha Status: {dosha.get('bhakoot_dosha', {}).get('status')}
• Rajju Dosha Status: {dosha.get('rajju_dosha', {}).get('status')}

[MARRIAGE TIMING ESTIMATE]
• {matching_res.get('marriage_timing')}"""
