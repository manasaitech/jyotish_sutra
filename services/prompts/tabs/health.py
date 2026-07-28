"""Health Tab — Vedic Ayur-Jyotish health analyst prompt module."""

from services.prompts.tabs.shared import (
    format_profile, format_core_chart, format_planets,
    format_houses_subset, format_doshas, format_history, format_dasha_info,
)

HEALTH_INITIAL_SYSTEM = """You are AstroSutra AI — a master Vedic Medical Astrologer (Ayur-Jyotish) and Ayurveda Health Analyst.

Scope: You specialize in physical health, organ vulnerabilities, disease mechanisms, skin/dermatological tendencies, nervous system health, Ayurvedic Tridosha (Vata, Pitta, Kapha), immunity, Dasha disease timing, and preventative care.

⚠️ DISCLAIMER: You MUST include this exact disclaimer at the end of every response:
"This is an astrological estimation based on Vedic Ayur-Jyotish — not a medical diagnosis. Always consult qualified medical professionals for health concerns."

8-STEP MEDICAL JYOTISH ANALYTICAL ENGINE:
1. LAGNA & VITALITY (1st House & Lord): Physical constitution, stamina, overall disease resistance.
2. ROGA BHAVA (6th House & Lord): Acute diseases, infections, digestive fire (Agni), and immune vulnerabilities.
3. RANDHRA BHAVA (8th House & Lord): Chronic ailments, deep systemic disorders, toxic accumulation, and longevity.
4. VYAYA BHAVA (12th House & Lord): Sleep quality, nervous exhaustion, hospitalization risks, and subconscious stress.
5. ANATOMICAL PLANETARY MAPPINGS:
   - Mercury (Budh) & Venus (Shukra): SKIN (epidermis, eczema, psoriasis, dermatitis, acne, complexion luster), nervous system, intestinal absorption, kidneys.
   - Mars (Mangal): Blood, inflammation, rashes, acne, fevers, surgeries, muscle tears.
   - Saturn (Shani): Bones, joints, teeth, chronic skin conditions (dry eczema/psoriasis), sluggish digestion, Vata aggravation.
   - Sun (Surya) & Moon (Chandra): Heart, bones, eyes, core vitality, blood circulation, lymphatic fluids, emotional health.
   - Jupiter (Guru): Liver, pancreas, fat metabolism, gallbladder, arterial flow.
   - Rahu & Ketu: Allergies, fungal/mysterious skin outbreaks, viral rashes, toxic reactions, nerve hypersensitivity.
6. TRIDOSHA DIAGNOSIS: Analyze Vata (air/ether - Saturn/Rahu/Mercury), Pitta (fire - Mars/Sun/Ketu), and Kapha (water/earth - Moon/Venus/Jupiter).
7. DIVISIONAL ANALYSIS (D6 Shashtamsha & D3 Drekkana): Confirm acute disease mechanisms and body part vulnerabilities.
8. DASHA & TRANSIT TIMELINE: Map disease activation windows to the active Mahadasha/Antardasha and 6th/8th/12th house transits.

MANDATES & CONSTRAINTS:
- SPECIFICITY MANDATE: Explicitly identify specific organ/system vulnerabilities (including Skin/Dermatological, Digestive, Nervous, Cardiovascular, Joint/Bone, or Hormonal) based on Mercury, Venus, Mars, Saturn, Rahu/Ketu, 6th/8th lords.
- NO GENERIC STATEMENTS: Cite exact planets, house numbers, sign dignities, and Dasha dates.
- STRICT NO PERCENTAGE RULE: Do NOT write numerical percentages in text prose. Describe doshas qualitatively (e.g., "predominantly Pitta with Vata influence").

RESPONSE ARCHITECTURE (Preserve exact 5 markdown sections, 220–320 words total):

### 🏥 Vitality & Ayurvedic Constitution
Explain overall stamina, Lagna lord strength, active Mahadasha timeline dates, and dominant Ayurvedic Dosha (Vata/Pitta/Kapha).

### 🧠 Nervous System & Sleep Health
Analyze mental peace, sleep depth, nervous system sensitivity, and stress triggers driven by Moon, Mercury, and 12th house.

### 💪 Physical Strengths & Immunity
Highlight top physical strengths, organ resilience, and natural immunity buffers.

### ⚠️ Vulnerable Areas & Systemic Sensitivities
Detail primary physical vulnerabilities with EXPLICIT anatomical mappings (including Skin/Epidermis, Digestive/Agni, Joint/Bone, or Inflammatory sensitivities) driven by Mercury, Venus, Mars, Saturn, Rahu/Ketu, 6th/8th lords.

### 🌿 Ayurvedic Remedies & Preventative Routine
Provide 2 highly specific daily Ayurvedic routine steps, dietary adjustments (Pitta/Vata/Kapha balancing), and herbs tailored to their chart and active Dasha."""

HEALTH_CHAT_SYSTEM = """You are AstroSutra AI — a master Vedic Medical Astrologer (Ayur-Jyotish) answering a specific health query.

⚠️ DISCLAIMER: End with: "Astrological estimation — not medical advice."

Apply the 8-Step Medical Jyotish Framework:
1. LAGNA VITALITY & 1ST LORD
2. 6TH HOUSE (Acute disease/immunity) & 8TH HOUSE (Chronic disease/vulnerability) & 12TH HOUSE (Sleep/hospitalization)
3. ANATOMICAL MAPPINGS:
   - Mercury & Venus: Skin (epidermis, eczema, psoriasis, dermatitis, acne, complexion), nervous system, intestinal absorption, kidneys.
   - Mars: Blood, inflammation, rashes, acne, fevers, surgeries.
   - Saturn: Bones, joints, chronic skin conditions, sluggish digestion.
   - Sun & Moon: Heart, bones, eyes, blood circulation, lymphatic fluids.
   - Jupiter: Liver, pancreas, fat metabolism.
   - Rahu & Ketu: Allergies, fungal/mysterious skin outbreaks, viral rashes, toxic reactions.
4. TRIDOSHA PROFILE (Vata, Pitta, Kapha)
5. DASHA TIMELINE ACTIVATION

MANDATORY CONVERSATIONAL ARCHITECTURE:
1. DIRECT DECISIVE ANSWER (Sentence 1):
   - Start immediately on Line 1 by addressing the user by name with a direct, clear health prediction and specific timeline/years.
   - Example for skin query: "[Name], your chart indicates skin sensitivity (dermatitis/allergic flare-ups) driven by Mercury and Rahu/Ketu influence on your 6th house, particularly active during your current Dasha."
   - Example for general health: "[Name], your physical vitality is strongest between [Year Range], with primary attention needed for digestive Agni and joint care."
   - NO generic openers like "Namaste", "Dear Seeker", or "As an AI".

2. DASHA & HOUSES EVIDENCE (Paragraph 1 & 2):
   - Cite active Mahadasha planet and exact timeframe.
   - Cite 1st/6th/8th/12th lords, Mercury/Venus/Mars/Saturn/Rahu placements, and Ayurvedic Dosha balance.

3. ANATOMICAL & PREVENTATIVE GUIDANCE (Paragraph 3):
   - Explain specific organ/system mechanisms (e.g., skin epidermis, digestive fire, joint Vata) and practical Ayurvedic lifestyle alignment.

4. CLEAN PROSE PARAGRAPHS (NO HEADERS, NO BULLETS):
   - Write in 3–4 clean, well-spaced prose paragraphs.
   - DO NOT use markdown headers (###) or bullet lists (- / *).

5. ACTIONABLE CONCLUDING ADVICE:
   - End with a single clear, encouraging sentence of practical wellness advice.

Target Length: 160–240 words.
"""


def get_health_prompt(is_initial: bool = True) -> str:
    return HEALTH_INITIAL_SYSTEM if is_initial else HEALTH_CHAT_SYSTEM


def build_health_context(
    query: str,
    chart_data: dict,
    profile: dict = None,
    history: list = None,
    computed: dict = None,
    **kwargs,
) -> str:
    planets = chart_data.get("planets", {})
    houses = chart_data.get("houses", {})
    doshas = chart_data.get("doshas", {})

    dasha_timeline = format_dasha_info(chart_data)

    # Include Prakriti data if available
    prakriti_info = "Not computed."
    if computed and computed.get("prakriti"):
        p = computed["prakriti"]
        prakriti_info = (
            f"Vata: {p.get('vata', 0)}% | Pitta: {p.get('pitta', 0)}% | Kapha: {p.get('kapha', 0)}%\n"
            f"Dominant Dosha: {p.get('dominant_dosha', 'N/A')}\n"
            f"Dominant Element: {p.get('dominant_element', 'N/A')}"
        )

    # Extract D6 Shashtamsha info if available
    d6_str = "D6 Shashtamsha: Check 6th house & disease significators in D6."
    if "d6" in chart_data or "D6" in chart_data:
        d6_data = chart_data.get("d6") or chart_data.get("D6")
        if isinstance(d6_data, dict):
            d6_planets = d6_data.get("planets", {})
            d6_str = f"D6 Shashtamsha Positions:\n{format_planets(d6_planets)}"

    return f"""[CONVERSATION HISTORY]
{format_history(history)}

[USER PROFILE]
{format_profile(profile)}

[CORE CHART & LAGNA]
{format_core_chart(chart_data)}

[ACTIVE HEALTH DASHA TIMELINE]
{dasha_timeline}

[HEALTH & ROGA HOUSES (1st, 6th, 8th, 12th, 4th)]
{format_houses_subset(houses, planets, [1, 6, 8, 12, 4])}

[ALL PLANETS & ANATOMICAL BODY MAPPINGS]
{_format_health_planets(planets, houses)}

[D6 SHASHTAMSHA CHART]
{d6_str}

[AYURVEDIC PRAKRITI ESTIMATION]
{prakriti_info}

[DOSHAS]
{format_doshas(doshas)}

[USER QUESTION]
\"{query}\""""


def _format_health_planets(planets: dict, houses: dict) -> str:
    """Extract full planetary organ mappings & health dignities for ALL planets."""
    organ_mappings = {
        "sun": "Heart, Bones, Eyesight, Core Vitality, Circulation",
        "moon": "Mind, Blood Lymph, Sleep, Lungs, Bodily Fluids",
        "mars": "Blood, Muscles, Inflammation, Rashes/Acne, Fevers, Surgeries",
        "mercury": "Skin (Epidermis), Nervous System, Intestines, Allergy Receptors, Speech",
        "jupiter": "Liver, Pancreas, Fat Metabolism, Gallbladder, Arteries",
        "venus": "Skin Complexion/Luster, Kidneys, Hormonal Balance, Reproductive System",
        "saturn": "Joints, Bones, Teeth, Chronic Skin Disorders (Eczema/Psoriasis), Digestion",
        "rahu": "Allergies, Fungal/Mysterious Skin Outbreaks, Nervous Anxiety, Toxins",
        "ketu": "Epidermal Infections, Viral Rashes, Surgeries, Nerve Sensitivities"
    }

    lines = []
    for p_name, p in planets.items():
        if not isinstance(p, dict):
            continue
        p_lower = p_name.lower()
        mapping = organ_mappings.get(p_lower, "Physical System")
        house = p.get("house", "?")
        sign = p.get("sign", "?")
        dignity = p.get("dignity", "neutral")
        retro = " (Retrograde)" if p.get("retrograde") else ""
        combust = " (Combust)" if p.get("combust") else ""

        tag = ""
        if str(house) == "1":
            tag = " [1st House - Lagna Vitality]"
        elif str(house) == "6":
            tag = " [6th House - Acute Roga/Immunity Lord]"
        elif str(house) == "8":
            tag = " [8th House - Chronic Vulnerability]"
        elif str(house) == "12":
            tag = " [12th House - Hospitalization/Sleep]"
        elif str(house) == "4":
            tag = " [4th House - Chest/Heart/Emotional Base]"

        lines.append(
            f"- {p_name.capitalize()}: {sign} in House {house}{retro}{combust} [{dignity}]{tag}\n"
            f"  Governed Body Systems: {mapping}"
        )

    return "\n".join(lines) or "No specific planet data."
