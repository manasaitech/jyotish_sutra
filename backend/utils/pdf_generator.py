import os
import datetime
from io import BytesIO
from typing import Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Line, String

# Astrology engine imports
from services.astrology.dasha import calculate_full_dasha_package
from services.astrology.doshas import check_manglik, check_kaal_sarp, check_sade_sati
from services.astrology.prakriti import estimate_prakriti
from services.astrology.finance_engine import calculate_d2_hora, calculate_indu_lagna
from backend.astrology.dosha_reasoning import compute_doshas
from backend.astrology.health_reasoning import _build_aspect_map

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip header/footer on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#7F8C8D"))

        # Draw header
        self.drawString(54, 785, "JyotishaSutra AI — Complete Astrology Data")
        self.setStrokeColor(colors.HexColor("#BDC3C7"))
        self.setLineWidth(0.5)
        self.line(54, 778, 541, 778)

        # Draw footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 40, page_text)
        self.drawString(54, 40, "Generated from JyotishaSutra's deterministic calculations.")
        self.line(54, 52, 541, 52)
        self.restoreState()


def draw_north_indian_kundli(chart_data: dict, width: float = 220) -> Drawing:
    scale = width / 400.0
    d = Drawing(width, width)
    
    # Background
    d.add(Rect(0, 0, width, width, fillColor=colors.HexColor("#FCF9F2"), strokeColor=colors.HexColor("#E67E22"), strokeWidth=2))
    
    # Diagonals
    d.add(Line(0, 0, width, width, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    d.add(Line(0, width, width, 0, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    
    # Inner Diamond
    d.add(Line(width/2, 0, width, width/2, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    d.add(Line(width, width/2, width/2, width, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    d.add(Line(width/2, width, 0, width/2, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    d.add(Line(0, width/2, width/2, 0, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1))
    
    # House Coordinates
    svg_coords = {
        1: {"sign": (200, 45), "planets": (200, 140)},
        2: {"sign": (75, 35), "planets": (100, 65)},
        3: {"sign": (35, 75), "planets": (65, 100)},
        4: {"sign": (45, 200), "planets": (120, 200)},
        5: {"sign": (35, 325), "planets": (65, 300)},
        6: {"sign": (75, 365), "planets": (100, 335)},
        7: {"sign": (200, 355), "planets": (200, 260)},
        8: {"sign": (325, 365), "planets": (300, 335)},
        9: {"sign": (365, 325), "planets": (335, 300)},
        10: {"sign": (355, 200), "planets": (270, 200)},
        11: {"sign": (365, 75), "planets": (335, 100)},
        12: {"sign": (325, 35), "planets": (300, 65)},
    }
    
    # Resolve ascendant sign
    meta = chart_data.get("metadata", {})
    asc_sign = meta.get("ascendant_sign") or chart_data.get("ascendant_sign") or "Aries"
    
    SIGN_NUMBER_MAP = {
        "Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6,
        "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12
    }
    
    asc_num = SIGN_NUMBER_MAP.get(asc_sign, 1)
    
    # Group planets by house
    planets = chart_data.get("planets", {})
    house_planets = {h: [] for h in range(1, 13)}
    
    PLANET_SHORT = {
        "sun": "Su", "moon": "Mo", "mars": "Ma", "mercury": "Me",
        "jupiter": "Ju", "venus": "Ve", "saturn": "Sa", "rahu": "Ra", "ketu": "Ke"
    }
    
    for p_name, p_data in planets.items():
        p_lower = p_name.lower()
        if p_lower in PLANET_SHORT:
            house_num = int(p_data.get("house", 1))
            house_planets[house_num].append(PLANET_SHORT[p_lower])
            
    for h in range(1, 13):
        sign_num = ((asc_num - 1 + (h - 1)) % 12) + 1
        
        # SVG to ReportLab Y coords
        svg_sign_x, svg_sign_y = svg_coords[h]["sign"]
        rl_sign_x = svg_sign_x * scale
        rl_sign_y = width - (svg_sign_y * scale)
        
        # Draw sign number in orange
        d.add(String(rl_sign_x, rl_sign_y - 4, str(sign_num), fontSize=9, fontName="Helvetica-Bold", textAnchor="middle", fillColor=colors.HexColor("#D35400")))
        
        # Planet list
        p_list = house_planets[h]
        if p_list:
            svg_p_x, svg_p_y = svg_coords[h]["planets"]
            rl_p_x = svg_p_x * scale
            rl_p_y = width - (svg_p_y * scale)
            
            p_text = ", ".join(p_list)
            d.add(String(rl_p_x, rl_p_y - 3, p_text, fontSize=8, fontName="Helvetica", textAnchor="middle", fillColor=colors.HexColor("#2C3E50")))
            
    return d


def format_degree(deg_val: Any) -> str:
    try:
        val = float(deg_val)
        deg = int(val)
        minutes = int((val - deg) * 60)
        return f"{deg}°{minutes:02d}'"
    except Exception:
        return str(deg_val)


def generate_astrology_pdf(birth_details: dict, chart_data: dict, computed: dict) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # Style modifications and custom definitions
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#E67E22"),
        alignment=1,
        spaceAfter=10,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#7F8C8D"),
        alignment=1,
        spaceAfter=40,
    )

    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#E67E22"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2C3E50"),
        spaceAfter=5,
    )

    bold_body_style = ParagraphStyle(
        "ReportBodyBold",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    header_cell_style = ParagraphStyle(
        "HeaderCell",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=body_style,
        fontSize=8.5,
        leading=11,
        spaceAfter=0,
    )

    story = []

    # ==========================================
    # COVER PAGE
    # ==========================================
    story.append(Spacer(1, 80))
    story.append(Paragraph("JYOTISHASUTRA AI", title_style))
    story.append(Paragraph("Ancient Wisdom · Modern Intelligence", subtitle_style))
    story.append(Spacer(1, 20))

    # Divider line
    divider = Drawing(487, 2)
    divider.add(Line(0, 0, 487, 0, strokeColor=colors.HexColor("#E67E22"), strokeWidth=1.5))
    story.append(divider)
    story.append(Spacer(1, 30))

    story.append(Paragraph("COMPLETE ASTROLOGY DATA DOSSIER", ParagraphStyle("CoverDossier", parent=title_style, fontSize=16, leading=20, textColor=colors.HexColor("#2C3E50"))))
    story.append(Spacer(1, 20))

    dob_formatted = birth_details.get("date_of_birth") or "N/A"
    tob_formatted = birth_details.get("time_of_birth") or "N/A"
    pob_formatted = birth_details.get("place_name") or birth_details.get("name") or "N/A"
    if pob_formatted == "Seeker" or not pob_formatted:
        pob_formatted = f"Lat: {birth_details.get('latitude', 28.6139)}, Lon: {birth_details.get('longitude', 77.209)}"

    # Metadata table
    meta_data = [
        [Paragraph("<b>Name:</b>", body_style), Paragraph(birth_details.get("name", "Seeker"), body_style)],
        [Paragraph("<b>Date of Birth:</b>", body_style), Paragraph(dob_formatted, body_style)],
        [Paragraph("<b>Time of Birth:</b>", body_style), Paragraph(tob_formatted, body_style)],
        [Paragraph("<b>Place of Birth:</b>", body_style), Paragraph(pob_formatted, body_style)],
        [Paragraph("<b>Generated On:</b>", body_style), Paragraph(datetime.date.today().strftime("%d %B %Y"), body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[130, 250], hAlign="CENTER")
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 120))
    story.append(Paragraph("<font color='#7F8C8D'><i>This document contains complete deterministic data computed by the JyotishaSutra astrological engine. No artificial intelligence or LLM-written interpretations are included.</i></font>", ParagraphStyle("CoverFooter", parent=body_style, alignment=1, fontSize=8.5, leading=12)))

    story.append(PageBreak())

    # ==========================================
    # TABLE OF CONTENTS
    # ==========================================
    story.append(Paragraph("TABLE OF CONTENTS", section_title_style))
    story.append(Spacer(1, 10))

    toc_items = [
        "1. Birth Details & Calculation Settings",
        "2. Ascendant (Lagna) Details",
        "3. Planetary Positions & Dignities",
        "4. House Analysis (Bhava Kundli)",
        "5. Nakshatra Placements",
        "6. Planetary Aspects & Vedic Drishti",
        "7. Detected Vedic Yogas",
        "8. Active Vedic Doshas",
        "9. Vimshottari Dasha Timeline",
        "10. D2 Hora Divisional Chart",
        "11. Ayurvedic Prakriti & Tridosha Element Distribution",
    ]

    for item in toc_items:
        story.append(Paragraph(f"<font color='#34495E'>{item}</font>", ParagraphStyle("TOCItem", parent=body_style, fontSize=10, leading=18)))
    
    story.append(PageBreak())

    # ==========================================
    # SECTION 1: Birth Details & Settings
    # ==========================================
    story.append(Paragraph("1. BIRTH DETAILS & CALCULATION SETTINGS", section_title_style))
    
    metadata = chart_data.get("metadata", {})
    ayanamsa_val = metadata.get("ayanamsa", 0.0)
    ayanamsa_str = format_degree(ayanamsa_val) if ayanamsa_val else "Lahiri (Chitra Paksha)"

    settings_data = [
        [Paragraph("<b>Zodiac System</b>", table_cell_style), Paragraph("Sidereal (Nirayana)", table_cell_style)],
        [Paragraph("<b>Ayanamsha</b>", table_cell_style), Paragraph(f"Lahiri / Chitra Paksha ({ayanamsa_str})", table_cell_style)],
        [Paragraph("<b>House System</b>", table_cell_style), Paragraph("Whole Sign (Equal Houses)", table_cell_style)],
        [Paragraph("<b>Timezone Offset</b>", table_cell_style), Paragraph(f"GMT {float(birth_details.get('timezone_offset', 5.5)):+g}", table_cell_style)],
        [Paragraph("<b>Latitude / Longitude</b>", table_cell_style), Paragraph(f"{birth_details.get('latitude')}°N, {birth_details.get('longitude')}°E", table_cell_style)],
    ]
    settings_table = Table(settings_data, colWidths=[200, 287])
    settings_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FAF8F3")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(settings_table)
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 2: Ascendant (Lagna) & D1 Visual Chart
    # ==========================================
    story.append(Paragraph("2. ASCENDANT & JANMA KUNDLI (LAGNA BIRTH CHART)", section_title_style))
    
    asc_deg = metadata.get("ascendant_longitude", 0.0)
    asc_deg_formatted = format_degree(asc_deg % 30.0) if asc_deg else "0°00'"
    asc_sign = metadata.get("ascendant_sign", "Aries")

    asc_para = f"Your Ascendant (Lagna) is in <b>{asc_sign}</b> at <b>{asc_deg_formatted}</b>. Below is your D1 Janma Kundli representing planetary positions in their respective houses at the exact moment of your birth."
    story.append(Paragraph(asc_para, body_style))
    story.append(Spacer(1, 10))

    # Draw the Kundli chart vector graphic
    kundli_drawing = draw_north_indian_kundli(chart_data, width=220)
    story.append(KeepTogether([
        kundli_drawing,
        Spacer(1, 15)
    ]))

    # ==========================================
    # SECTION 3: Planetary Positions
    # ==========================================
    story.append(Paragraph("3. PLANETARY POSITIONS & DIGNITIES", section_title_style))
    
    planets_headers = ["Planet", "Sign", "Degree", "House", "Nakshatra", "Pada", "Retro", "Combust", "Dignity"]
    planets_rows = [[Paragraph(h, header_cell_style) for h in planets_headers]]

    planets_list = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"]
    planets_data = chart_data.get("planets", {})

    for p in planets_list:
        p_data = planets_data.get(p)
        if not p_data:
            continue
            
        p_name = p.capitalize()
        sign = p_data.get("sign", "Aries")
        deg = format_degree(p_data.get("degree", 0.0))
        house = str(p_data.get("house", 1))
        
        nak_dict = p_data.get("nakshatra") or {}
        nak_name = nak_dict.get("name", "N/A")
        pada = str(nak_dict.get("pada", 1))
        
        retro = "Yes" if p_data.get("retrograde") else "No"
        combust = "Yes" if p_data.get("combust") else "No"
        dignity = p_data.get("dignity", "Neutral").capitalize()

        row = [
            Paragraph(f"<b>{p_name}</b>", table_cell_style),
            Paragraph(sign, table_cell_style),
            Paragraph(deg, table_cell_style),
            Paragraph(house, table_cell_style),
            Paragraph(nak_name, table_cell_style),
            Paragraph(pada, table_cell_style),
            Paragraph(retro, table_cell_style),
            Paragraph(combust, table_cell_style),
            Paragraph(dignity, table_cell_style),
        ]
        planets_rows.append(row)

    planets_table = Table(planets_rows, colWidths=[55, 50, 50, 40, 75, 35, 45, 55, 82])
    planets_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(planets_table)
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 4: House Analysis (Bhava)
    # ==========================================
    story.append(Paragraph("4. HOUSE ANALYSIS (BHAVA KUNDLI)", section_title_style))
    
    house_headers = ["House", "Zodiac Sign", "House Lord", "Occupant Planets", "Aspected By"]
    house_rows = [[Paragraph(h, header_cell_style) for h in house_headers]]

    houses_data = chart_data.get("houses", {})
    aspect_map = _build_aspect_map(planets_data)

    for h_num in range(1, 13):
        h_str = str(h_num)
        h_data = houses_data.get(h_str)
        if not h_data:
            continue
            
        sign = h_data.get("sign", "Aries")
        lord = (h_data.get("lord") or "N/A").capitalize()
        
        occupants = h_data.get("occupants", [])
        occupants_str = ", ".join([o.capitalize() for o in occupants]) if occupants else "None"
        
        aspects = aspect_map.get(h_num, [])
        aspects_str = ", ".join([a.capitalize() for a in aspects]) if aspects else "None"

        row = [
            Paragraph(f"<b>House {h_num}</b>", table_cell_style),
            Paragraph(sign, table_cell_style),
            Paragraph(lord, table_cell_style),
            Paragraph(occupants_str, table_cell_style),
            Paragraph(aspects_str, table_cell_style),
        ]
        house_rows.append(row)

    house_table = Table(house_rows, colWidths=[65, 85, 85, 110, 142])
    house_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(house_table)
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 5: Nakshatras
    # ==========================================
    story.append(Paragraph("5. NAKSHATRA PLACEMENTS", section_title_style))
    
    moon_nak = metadata.get("nakshatra", "N/A")
    moon_pada = metadata.get("pada", 1)
    story.append(Paragraph(f"Your Moon Nakshatra (Janma Nakshatra) is <b>{moon_nak}</b> (Pada <b>{moon_pada}</b>), which governs your mental temperament, emotional responses, and primary life pathways.", body_style))
    story.append(Spacer(1, 8))

    nak_headers = ["Planet", "Nakshatra", "Nakshatra Lord", "Pada", "Longitude in Nakshatra"]
    nak_rows = [[Paragraph(h, header_cell_style) for h in nak_headers]]

    for p in planets_list:
        p_data = planets_data.get(p)
        if not p_data:
            continue
            
        nak_dict = p_data.get("nakshatra") or {}
        nak_name = nak_dict.get("name", "N/A")
        nak_lord = (nak_dict.get("lord") or "N/A").capitalize()
        pada = str(nak_dict.get("pada", 1))
        deg_in_nak = format_degree(nak_dict.get("degree_in_nakshatra", 0.0))

        row = [
            Paragraph(f"<b>{p.capitalize()}</b>", table_cell_style),
            Paragraph(nak_name, table_cell_style),
            Paragraph(nak_lord, table_cell_style),
            Paragraph(pada, table_cell_style),
            Paragraph(deg_in_nak, table_cell_style),
        ]
        nak_rows.append(row)

    nak_table = Table(nak_rows, colWidths=[90, 100, 100, 70, 127])
    nak_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(nak_table)
    story.append(Spacer(1, 15))

    story.append(PageBreak())

    # ==========================================
    # SECTION 6: Planetary Aspects
    # ==========================================
    story.append(Paragraph("6. PLANETARY ASPECTS & VEDIC DRISHTI", section_title_style))
    story.append(Paragraph("Below are the active aspects (Vedic Drishti) calculated deterministically between planets and target houses/planets based on classical Jyotish rules.", body_style))
    story.append(Spacer(1, 8))

    aspect_headers = ["Aspecting Planet", "Source House", "Vedic Aspect", "Aspected Target House", "Occupants of Target House"]
    aspect_rows = [[Paragraph(h, header_cell_style) for h in aspect_headers]]

    for p in planets_list:
        p_data = planets_data.get(p)
        if not p_data:
            continue
            
        p_house = int(p_data.get("house", 1))
        
        # Calculate aspected houses
        h = p_house
        aspected = [((h - 1 + 6) % 12) + 1] # 7th aspect
        
        aspect_names = {aspected[0]: "7th Aspect (Full)"}
        
        if p == "mars":
            h4 = ((h - 1 + 3) % 12) + 1
            h8 = ((h - 1 + 7) % 12) + 1
            aspected.extend([h4, h8])
            aspect_names[h4] = "4th Aspect (Special)"
            aspect_names[h8] = "8th Aspect (Special)"
        elif p == "jupiter":
            h5 = ((h - 1 + 4) % 12) + 1
            h9 = ((h - 1 + 8) % 12) + 1
            aspected.extend([h5, h9])
            aspect_names[h5] = "5th Aspect (Special)"
            aspect_names[h9] = "9th Aspect (Special)"
        elif p == "saturn":
            h3 = ((h - 1 + 2) % 12) + 1
            h10 = ((h - 1 + 9) % 12) + 1
            aspected.extend([h3, h10])
            aspect_names[h3] = "3rd Aspect (Special)"
            aspect_names[h10] = "10th Aspect (Special)"

        for target in sorted(aspected):
            target_data = houses_data.get(str(target)) or {}
            occupants = target_data.get("occupants", [])
            occupants_str = ", ".join([o.capitalize() for o in occupants]) if occupants else "Empty House"
            asp_label = aspect_names.get(target, "Full Aspect")

            row = [
                Paragraph(f"<b>{p.capitalize()}</b>", table_cell_style),
                Paragraph(f"House {p_house}", table_cell_style),
                Paragraph(asp_label, table_cell_style),
                Paragraph(f"House {target}", table_cell_style),
                Paragraph(occupants_str, table_cell_style),
            ]
            aspect_rows.append(row)

    aspect_table = Table(aspect_rows, colWidths=[90, 80, 110, 100, 107])
    aspect_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(aspect_table)
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 7: Yogas
    # ==========================================
    story.append(Paragraph("7. DETECTED VEDIC YOGAS", section_title_style))
    yogas = chart_data.get("yogas", [])
    active_yogas = [y for y in yogas if y.get("is_present")]

    if active_yogas:
        for y in active_yogas:
            y_name = y.get("name", "Vedic Yoga")
            y_desc = y.get("description", "Combination present in birth chart.")
            
            yoga_block = []
            yoga_block.append(Paragraph(f"<b>• {y_name}</b>", bold_body_style))
            yoga_block.append(Paragraph(f"<i>Details: {y_desc}</i>", body_style))
            yoga_block.append(Spacer(1, 4))
            story.append(KeepTogether(yoga_block))
    else:
        story.append(Paragraph("No major planetary yogas detected in the birth chart.", body_style))
    story.append(Spacer(1, 10))

    # ==========================================
    # SECTION 8: Stored Doshas
    # ==========================================
    story.append(Paragraph("8. ACTIVE VEDIC DOSHAS", section_title_style))
    doshas = chart_data.get("doshas", {})

    dosha_items = [
        ("Manglik Dosha", doshas.get("manglik")),
        ("Kaal Sarp Dosha", doshas.get("kaal_sarp")),
        ("Sade Sati", doshas.get("sade_sati"))
    ]

    for name, d_val in dosha_items:
        if d_val:
            is_present = d_val.get("is_present", False)
            status_text = "<b>PRESENT</b>" if is_present else "Absent"
            desc = d_val.get("description", "")
            phase = f" (Phase: {d_val.get('phase')})" if d_val.get("phase") and is_present else ""

            dosha_block = []
            dosha_block.append(Paragraph(f"<b>• {name}</b>: {status_text}{phase}", bold_body_style))
            dosha_block.append(Paragraph(f"<i>Analysis: {desc}</i>", body_style))
            dosha_block.append(Spacer(1, 4))
            story.append(KeepTogether(dosha_block))
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ==========================================
    # SECTION 9: Vimshottari Dasha
    # ==========================================
    story.append(Paragraph("9. VIMSHOTTARI DASHA TIMELINE", section_title_style))
    story.append(Paragraph("Vimshottari Dasha is the most widely trusted system in Vedic astrology, partitioning a 120-year human life cycle into planetary Mahadashas. Below is the chronological timeline of your Mahadashas.", body_style))
    story.append(Spacer(1, 8))

    # Calculate dasha timeline
    moon_long = float(planets_data.get("moon", {}).get("longitude", 0.0))
    dob_str = birth_details.get("date_of_birth") or "2000-01-01"
    try:
        birth_date = datetime.datetime.strptime(dob_str, "%Y-%m-%d").date()
    except Exception:
        birth_date = datetime.date(2000, 1, 1)

    dasha_pkg = calculate_full_dasha_package(moon_long, birth_date)
    dasha_timeline = dasha_pkg.get("timeline", [])

    dasha_headers = ["Mahadasha Lord", "Start Date", "End Date", "Status"]
    dasha_rows = [[Paragraph(h, header_cell_style) for h in dasha_headers]]

    current_mahadasha = dasha_pkg.get("current_mahadasha", {})
    active_lord = current_mahadasha.get("planet", "").lower()

    for d in dasha_timeline:
        lord = d.get("planet", "").capitalize()
        s_date = d.get("start_date")
        e_date = d.get("end_date")
        
        if hasattr(s_date, "strftime"):
            s_date = s_date.strftime("%d %b %Y")
        if hasattr(e_date, "strftime"):
            e_date = e_date.strftime("%d %b %Y")

        is_active = d.get("planet", "").lower() == active_lord
        status = "<b>ACTIVE (Current)</b>" if is_active else "Inactive"

        row = [
            Paragraph(f"<b>{lord} Mahadasha</b>", table_cell_style),
            Paragraph(str(s_date), table_cell_style),
            Paragraph(str(e_date), table_cell_style),
            Paragraph(status, table_cell_style),
        ]
        dasha_rows.append(row)

    dasha_table = Table(dasha_rows, colWidths=[130, 110, 110, 137])
    dasha_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(dasha_table)
    story.append(Spacer(1, 15))

    current_antar = dasha_pkg.get("current_antardasha", {})
    curr_mahadasha_name = current_mahadasha.get("planet_name", active_lord.capitalize())
    curr_antar_name = current_antar.get("planet_name", "N/A")

    story.append(Paragraph(f"<b>Current Active Period:</b> Your active Mahadasha is governed by <b>{curr_mahadasha_name}</b>, and the active Antardasha is governed by <b>{curr_antar_name}</b>.", body_style))
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 10: D2 Hora
    # ==========================================
    story.append(Paragraph("10. D2 HORA DIVISIONAL PLACEMENTS", section_title_style))
    story.append(Paragraph("The D2 Hora chart is the primary Vedic divisional sub-chart (varga) for analyzing wealth accumulation, savings capacity, and liquid assets. Planets are divided between the Sun's Hora (Leo) and the Moon's Hora (Cancer).", body_style))
    story.append(Spacer(1, 8))

    d2_pkg = calculate_d2_hora(planets_data)
    
    d2_headers = ["Hora Group", "Planets Placed"]
    d2_rows = [
        [Paragraph(h, header_cell_style) for h in d2_headers],
        [Paragraph("<b>Sun Hora (Leo) Placements</b><br/><i>Active Enterprise & Earning</i>", table_cell_style), Paragraph(", ".join(d2_pkg.get("sun_hora_planets", [])), table_cell_style)],
        [Paragraph("<b>Moon Hora (Cancer) Placements</b><br/><i>Liquid Savings & Preservation</i>", table_cell_style), Paragraph(", ".join(d2_pkg.get("moon_hora_planets", [])), table_cell_style)],
    ]
    d2_table = Table(d2_rows, colWidths=[200, 287])
    d2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(d2_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>Dominant Hora Indicator:</b> {d2_pkg.get('dominant_hora', 'N/A')}", body_style))
    story.append(Spacer(1, 15))

    # ==========================================
    # SECTION 11: Tridosha / Ayurvedic Prakriti
    # ==========================================
    story.append(Paragraph("11. AYURVEDIC PRAKRITI & TRIDOSHA CONSTITUTION", section_title_style))
    story.append(Paragraph("Prakriti refers to the unique, inborn physical and mental constitution of an individual, calculated here from planetary elements and Nakshatra placements. It highlights the ratio of Vata, Pitta, and Kapha doshas.", body_style))
    story.append(Spacer(1, 8))

    prakriti_pkg = estimate_prakriti(chart_data)
    
    vata_pct = float(prakriti_pkg.get("vata", 33.3))
    pitta_pct = float(prakriti_pkg.get("pitta", 33.3))
    kapha_pct = float(prakriti_pkg.get("kapha", 33.3))
    dominant_dosha = str(prakriti_pkg.get("dominant_dosha", "Vata-Pitta-Kapha")).capitalize()
    dominant_element = str(prakriti_pkg.get("dominant_element", "Air")).capitalize()

    prakriti_rows = [
        [Paragraph("<b>Ayurvedic Dosha</b>", header_cell_style), Paragraph("<b>Estimated Percentage Contribution</b>", header_cell_style)],
        [Paragraph("<b>Vata Dosha (Air & Ether)</b>", table_cell_style), Paragraph(f"{vata_pct:.1f}%", table_cell_style)],
        [Paragraph("<b>Pitta Dosha (Fire & Water)</b>", table_cell_style), Paragraph(f"{pitta_pct:.1f}%", table_cell_style)],
        [Paragraph("<b>Kapha Dosha (Water & Earth)</b>", table_cell_style), Paragraph(f"{kapha_pct:.1f}%", table_cell_style)],
    ]
    prakriti_table = Table(prakriti_rows, colWidths=[200, 287])
    prakriti_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E67E22")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E9DFC8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#FAF8F3")]),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(prakriti_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>Dominant Ayurvedic Constitution:</b> <b>{dominant_dosha}</b> (Dominant astrological element: <b>{dominant_element}</b>).", body_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
