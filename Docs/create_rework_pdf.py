from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib import colors

W, H = A4
MARGIN = 10 * mm

doc = SimpleDocTemplate(
    r"d:\CodeProjects\FLARM-USB-Updater\Docs\REV_A_Rework_Guide.pdf",
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=8 * mm,
)

# Colors
DARK = HexColor("#1a1a1a")
ACCENT = HexColor("#b00020")
GRAY = HexColor("#555555")
LIGHT_BG = HexColor("#f5f5f5")
WHITE = HexColor("#ffffff")

# Styles
title_style = ParagraphStyle("title", fontSize=13, leading=15, fontName="Helvetica-Bold", textColor=ACCENT)
subtitle_style = ParagraphStyle("subtitle", fontSize=7, leading=9, fontName="Helvetica", textColor=GRAY)
h2_style = ParagraphStyle("h2", fontSize=8.5, leading=10, fontName="Helvetica-Bold", textColor=DARK, spaceBefore=4, spaceAfter=1.5)
body_style = ParagraphStyle("body", fontSize=6.5, leading=8.2, fontName="Helvetica", textColor=DARK)
bold_body = ParagraphStyle("boldbody", fontSize=6.5, leading=8.2, fontName="Helvetica-Bold", textColor=DARK)
mono_style = ParagraphStyle("mono", fontSize=6, leading=7.5, fontName="Courier", textColor=DARK, leftIndent=4)
check_style = ParagraphStyle("check", fontSize=6.5, leading=8.2, fontName="Helvetica", textColor=DARK, leftIndent=8)
small_style = ParagraphStyle("small", fontSize=6, leading=7.5, fontName="Helvetica", textColor=GRAY)

story = []

# Title
story.append(Paragraph("REV A Rework Guide — Boost Converter Fix", title_style))
story.append(Paragraph("FLARM USB Updater  |  MT3608 boost produces 0V — L1 and D1 in wrong position  |  Fix: desolder L1/D1, resolder with correct topology", subtitle_style))
story.append(Spacer(1, 2))
story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT))
story.append(Spacer(1, 3))

# Bug section - compact two-column with diagrams
bug_before = Paragraph('<font face="Courier" size="6">VUSB──IN   SW──L1──VBOOST──D1──V12_OUT</font>', body_style)
bug_after = Paragraph('<font face="Courier" size="6">VUSB──L1──SW──D1──V12_OUT (C3,R1/R2)</font>', body_style)

bug_table = Table([
    [Paragraph("<b>WRONG (REV A):</b>", ParagraphStyle("", fontSize=6.5, fontName="Helvetica-Bold", textColor=ACCENT)),
     bug_before],
    [Paragraph("<b>CORRECT:</b>", ParagraphStyle("", fontSize=6.5, fontName="Helvetica-Bold", textColor=HexColor("#2e7d32"))),
     bug_after],
], colWidths=[55, W - 2*MARGIN - 60])
bug_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
    ("BOX", (0, 0), (-1, -1), 0.3, GRAY),
]))
story.append(bug_table)
story.append(Spacer(1, 3))

# Tools + Components side by side
tools_text = Paragraph(
    "<b>Tools:</b> Fine-tip iron, hot air (or 2nd iron), flux, 30AWG wire, tweezers, Kapton tape, multimeter, solder wick", body_style)
comp_data = [
    [Paragraph("<b>Ref</b>", bold_body), Paragraph("<b>Part</b>", bold_body), Paragraph("<b>Package</b>", bold_body), Paragraph("<b>Notes</b>", bold_body)],
    [Paragraph("L1", body_style), Paragraph("SMNR4020 22uH", body_style), Paragraph("4.0x4.0mm", body_style), Paragraph("Non-polarized", body_style)],
    [Paragraph("D1", body_style), Paragraph("B5819W SL", body_style), Paragraph("SOD-123", body_style), Paragraph("Cathode = bar marking", body_style)],
]
comp_table = Table(comp_data, colWidths=[22, 62, 42, 60])
comp_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#e0e0e0")),
    ("GRID", (0, 0), (-1, -1), 0.3, GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("LEFTPADDING", (0, 0), (-1, -1), 2),
]))

top_row = Table([[tools_text, comp_table]], colWidths=[(W - 2*MARGIN) * 0.48, (W - 2*MARGIN) * 0.52])
top_row.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(top_row)
story.append(Spacer(1, 2))
story.append(HRFlowable(width="100%", thickness=0.3, color=GRAY))
story.append(Spacer(1, 2))

# Steps - two column layout
def make_step(num, title, lines):
    parts = []
    parts.append(Paragraph(f"<b>Step {num} — {title}</b>", h2_style))
    for line in lines:
        if line.startswith("!"):
            parts.append(Paragraph(f"<b>{line[1:]}</b>", ParagraphStyle("verify", fontSize=6, leading=7.5, fontName="Helvetica-Bold", textColor=HexColor("#1565c0"))))
        else:
            parts.append(Paragraph(line, body_style))
    return parts

col1_parts = []
col2_parts = []

# Step 1
col1_parts += make_step(1, "Desolder L1", [
    "1. Apply flux around L1 (4x4mm shielded inductor)",
    "2. Heat with hot air ~350C or iron on both pads",
    "3. Lift off with tweezers, clean pads with wick",
    "4. Set L1 aside — will be reused",
])
col1_parts.append(Spacer(1, 2))

# Step 2
col1_parts += make_step(2, "Desolder D1", [
    "1. Apply flux around D1 (SOD-123)",
    "2. Heat with hot air or two irons simultaneously",
    "3. Lift off, clean pads, set aside for reuse",
])
col1_parts.append(Spacer(1, 2))

# Step 3
col1_parts += make_step(3, "Bridge D1's empty pads", [
    "Solder blob or short wire across D1's two empty",
    "pads. Connects V12_OUT directly to VBOOST net.",
    "!Verify: continuity RJ45 pin1/2 to C3+ pad",
])
col1_parts.append(Spacer(1, 2))

# Step 4
col2_parts += make_step(4, "Solder L1 with flying wires", [
    "1. Cut two 30AWG wires ~15mm each",
    "2. Solder one wire to each L1 pad (either way)",
    "3. Wire A to <b>VUSB</b>: C1 positive pad",
    "4. Wire B to <b>MT3608 pin 1 (SW)</b>: corner pin",
    "!Verify: L1-A to USB VBUS, L1-B to pin 1 only",
])
col2_parts.append(Spacer(1, 2))

# Step 5
col2_parts += make_step(5, "Solder D1 with flying wires", [
    "1. Cut two 30AWG wires ~15mm each",
    "2. Cathode = bar marking on package",
    "3. <b>Anode</b> wire to <b>MT3608 pin 1 (SW)</b>",
    "4. <b>Cathode</b> wire to <b>C3 positive pad</b>",
    "!Verify (diode mode): SW to C3+ reads 0.2-0.4V",
])
col2_parts.append(Spacer(1, 2))

# Step 6
col2_parts += make_step(6, "Secure components", [
    "1. Tack L1 and D1 down with Kapton tape",
    "2. Check no wire-to-wire shorts",
    "3. Route wires away from other components",
])

step_table = Table([[col1_parts, col2_parts]],
    colWidths=[(W - 2*MARGIN) * 0.49, (W - 2*MARGIN) * 0.49],
    hAlign="LEFT")
step_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (0, 0), 0),
    ("RIGHTPADDING", (0, 0), (0, 0), 4),
    ("LEFTPADDING", (1, 0), (1, 0), 4),
    ("RIGHTPADDING", (1, 0), (1, 0), 0),
]))
story.append(step_table)
story.append(Spacer(1, 2))
story.append(HRFlowable(width="100%", thickness=0.3, color=GRAY))
story.append(Spacer(1, 2))

# Pre-power checklist and power-on test side by side
story.append(Paragraph("<b>Pre-Power Verification Checklist</b>", h2_style))

checks = [
    "No short between VUSB and GND",
    "No short between V12_OUT and GND",
    "Continuity: L1 wire A to VUSB rail",
    "Continuity: L1 wire B to MT3608 pin 1",
    "Continuity: D1 cathode to C3+ / V12_OUT",
    "Continuity: D1 anode to MT3608 pin 1",
    "Diode check: SW to V12_OUT reads 0.2-0.4V fwd",
    "D1 empty pads bridged: V12_OUT to C3+ continuity",
    "No solder bridges on MT3608 (check all 6 pins)",
]

check_col1 = []
check_col2 = []
for i, c in enumerate(checks):
    target = check_col1 if i < 5 else check_col2
    sq = '<font face="ZapfDingbats" size="6">\u274f</font>'
    target.append(Paragraph(f"\u2610  {c}", check_style))

check_table = Table([
    [check_col1[0], check_col2[0] if len(check_col2) > 0 else ""],
    [check_col1[1], check_col2[1] if len(check_col2) > 1 else ""],
    [check_col1[2], check_col2[2] if len(check_col2) > 2 else ""],
    [check_col1[3], check_col2[3] if len(check_col2) > 3 else ""],
    [check_col1[4] if len(check_col1) > 4 else "", ""],
], colWidths=[(W - 2*MARGIN) * 0.5, (W - 2*MARGIN) * 0.5])
check_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
]))
story.append(check_table)
story.append(Spacer(1, 2))
story.append(HRFlowable(width="100%", thickness=0.3, color=GRAY))
story.append(Spacer(1, 2))

# Power-on test + troubleshooting side by side
power_parts = []
power_parts.append(Paragraph("<b>Power-On Test</b>", h2_style))
power_parts.append(Paragraph("1. Plug USB-C into a USB port (not charger)", body_style))
power_parts.append(Paragraph("2. LED1 (green) should light up", body_style))
power_parts.append(Paragraph("3. Measure V12_OUT at RJ45 pins 1&2 vs GND (4/7/8)", body_style))
power_parts.append(Paragraph("4. <b>Expected: ~12.4V</b>", body_style))
power_parts.append(Paragraph("5. If OK, connect to FLARM and test update", body_style))

trouble_parts = []
trouble_parts.append(Paragraph("<b>Troubleshooting</b>", h2_style))

trouble_data = [
    [Paragraph("<b>Symptom</b>", bold_body), Paragraph("<b>Check</b>", bold_body)],
    [Paragraph("0V on V12_OUT", body_style), Paragraph("D1 pads bridged? L1 to VUSB?", body_style)],
    [Paragraph("~5V on V12_OUT", body_style), Paragraph("D1 reversed (anode/cathode)", body_style)],
    [Paragraph("~5V and hot", body_style), Paragraph("Solder bridge on MT3608", body_style)],
    [Paragraph("Unstable voltage", body_style), Paragraph("Cold joint on L1 or D1 wires", body_style)],
    [Paragraph("USB port off", body_style), Paragraph("VUSB-GND short, check joints", body_style)],
]
trouble_table = Table(trouble_data, colWidths=[52, 80])
trouble_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#e0e0e0")),
    ("GRID", (0, 0), (-1, -1), 0.3, GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("LEFTPADDING", (0, 0), (-1, -1), 2),
]))
trouble_parts.append(trouble_table)

bottom_table = Table([[power_parts, trouble_parts]],
    colWidths=[(W - 2*MARGIN) * 0.48, (W - 2*MARGIN) * 0.52])
bottom_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(bottom_table)

doc.build(story)
print("PDF created: REV_A_Rework_Guide.pdf")
