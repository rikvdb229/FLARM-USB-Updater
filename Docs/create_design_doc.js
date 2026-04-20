const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
        BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');

const tb = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cb = { top: tb, bottom: tb, left: tb, right: tb };
const hdrShade = { fill: "1B3A5C", type: ShadingType.CLEAR };
const altShade = { fill: "F2F6FA", type: ShadingType.CLEAR };
const noShade = { fill: "FFFFFF", type: ShadingType.CLEAR };

function hdrCell(text, width) {
  return new TableCell({ borders: cb, width: { size: width, type: WidthType.DXA }, shading: hdrShade, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18, color: "FFFFFF", font: "Arial" })] })] });
}
function cell(text, width, shade) {
  return new TableCell({ borders: cb, width: { size: width, type: WidthType.DXA }, shading: shade || noShade, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text, size: 18, font: "Arial" })] })] });
}

const bom = [
  ["U1", "FT232RL-REEL", "USB to UART converter", "SSOP-28", "C8690", "Extended"],
  ["U2", "MAX3232CSE+T", "RS232 transceiver (dual)", "SOIC-16", "C7258", "Extended"],
  ["U3", "MT3608", "Step-up DC-DC converter", "SOT-23-6", "C84817", "Extended"],
  ["U4", "AMS1117-3.3", "3.3V LDO regulator", "SOT-223", "C6186", "Basic"],
  ["D1", "B5819W SL", "Schottky diode (boost freewheel)", "SOD-123", "C8598", "Basic"],
  ["D2", "USBLC6-2SC6", "USB ESD protection", "SOT-23-6", "C7519", "Extended"],
  ["L1", "SMNR4020-22UH", "22\u00B5H inductor (boost)", "4x4mm SMD", "C135264", "Extended"],
  ["J1", "TYPE-C-31-M-12", "USB-C receptacle", "SMD 12-pin", "C165948", "Extended"],
  ["RJ1", "RJ-064-1", "RJ45 jack (SMD)", "SMD", "C7205199", "Extended"],
  ["J3", "HDR-M 1x3P", "TTL UART breakout (unpop.)", "2.54mm PTH", "N/A", "N/A"],
  ["LED1", "KT-0805G", "Power LED (green)", "0805", "C2297", "Basic"],
  ["LED2", "KT-0805Y", "TX LED (yellow)", "0805", "C2296", "Basic"],
  ["LED3", "KT-0805Y", "RX LED (yellow)", "0805", "C2296", "Basic"],
  ["R1", "0402WGF1003TCE", "100k\u03A9 \u00B11% (boost FB top)", "0402", "C25741", "Basic"],
  ["R2", "0402WGF5101TCE", "5.1k\u03A9 \u00B11% (boost FB bottom)", "0402", "C25905", "Basic"],
  ["R4", "0402WGF5101TCE", "5.1k\u03A9 \u00B11% (USB CC1)", "0402", "C25905", "Basic"],
  ["R5", "0402WGF5101TCE", "5.1k\u03A9 \u00B11% (USB CC2)", "0402", "C25905", "Basic"],
  ["R6", "0402WGF100JTCE", "10\u03A9 \u00B11% (LDO to RJ45)", "0402", "C25077", "Basic"],
  ["R7", "0402WGF6800TCE", "680\u03A9 \u00B11% (power LED)", "0402", "C25130", "Basic"],
  ["R8", "0402WGF6800TCE", "680\u03A9 \u00B11% (TX LED)", "0402", "C25130", "Basic"],
  ["R9", "0402WGF6800TCE", "680\u03A9 \u00B11% (RX LED)", "0402", "C25130", "Basic"],
  ["C1", "CL21A226MAQNNNE", "22\u00B5F 25V (boost input)", "0805", "C45783", "Basic"],
  ["C3", "CL21A226MAQNNNE", "22\u00B5F 25V (boost output)", "0805", "C45783", "Basic"],
  ["C5", "CL05B104KB54PNC", "100nF (MAX3232 VCC decoupling)", "0402", "C307331", "Basic"],
  ["C6-C9", "CL05B104KB54PNC", "100nF (MAX3232 charge pump + V+/V-)", "0402", "C307331", "Basic"],
  ["C10", "CL21A475KAQNNNE", "4.7\u00B5F (FT232RL VCC bulk)", "0805", "C1779", "Basic"],
  ["C11-C13", "CL05B104KB54PNC", "100nF (FT232RL VCC/VCCIO decoupling)", "0402", "C307331", "Basic"],
  ["C14", "CL05B104KB54PNC", "100nF (USBLC6 VCC)", "0402", "C307331", "Basic"],
  ["C15", "CL21A226MAQNNNE", "22\u00B5F 25V (LDO input)", "0805", "C45783", "Basic"],
  ["C16", "CL21A226MAQNNNE", "22\u00B5F 25V (LDO output)", "0805", "C45783", "Basic"],
];

const rj45pins = [
  ["1", "+12V (V12_OUT)", "Linked with pin 2"],
  ["2", "+12V (V12_OUT)", "Linked with pin 1"],
  ["3", "+3.3V (V3V3_OUT via R6)", "FLARM supplies 3V during updates"],
  ["4", "GND", "Linked with pins 7, 8"],
  ["5", "FLARM TX (RS232_RX)", "PC-side: SUB-D9 pin 2"],
  ["6", "FLARM RX (RS232_TX)", "PC-side: SUB-D9 pin 3"],
  ["7", "GND", "Linked with pins 4, 8"],
  ["8", "GND", "PC-side: SUB-D9 pin 5"],
];

const nets = [
  ["VUSB", "USB 5V supply from USB-C"],
  ["GND", "Ground (pour both layers)"],
  ["SW", "Boost switch node (L1 \u2192 U3 SW \u2192 D1 anode)"],
  ["V12_OUT", "Boost output after Schottky D1 (~12.0V)"],
  ["FB", "Boost feedback divider midpoint (0.6V ref)"],
  ["V3V3", "AMS1117 3.3V output"],
  ["V3V3_OUT", "3.3V to FLARM via R6 (10\u03A9)"],
  ["FT_3V3", "FT232RL 3V3OUT (pin 17, C12 decoupling only)"],
  ["UD+", "USB data positive (differential pair, post-ESD)"],
  ["UD-", "USB data negative (differential pair, post-ESD)"],
  ["UD_IN+", "USB data positive (USB-C side of USBLC6)"],
  ["UD_IN-", "USB data negative (USB-C side of USBLC6)"],
  ["CC1", "USB-C configuration channel 1 (5.1k\u03A9 to GND)"],
  ["CC2", "USB-C configuration channel 2 (5.1k\u03A9 to GND)"],
  ["UART_TX", "TTL-level TX (FT232RL \u2192 MAX3232 / J3)"],
  ["UART_RX", "TTL-level RX (MAX3232 / J3 \u2192 FT232RL)"],
  ["RS232_TX", "RS232-level TX (to FLARM RX on RJ45)"],
  ["RS232_RX", "RS232-level RX (from FLARM TX on RJ45)"],
  ["TXLED", "FT232RL CBUS0 (active-low TX indicator)"],
  ["RXLED", "FT232RL CBUS1 (active-low RX indicator)"],
  ["CP1P/CP1N", "MAX3232 charge pump 1 flying cap (C6)"],
  ["CP2P/CP2N", "MAX3232 charge pump 2 flying cap (C7)"],
  ["VS_POS/VS_NEG", "MAX3232 \u00B1 supply (C8/C9)"],
  ["LED1_K/LED2_K/LED3_K", "LED cathode nodes"],
];

function makeTable(headers, rows, colWidths) {
  const hdrRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => hdrCell(h, colWidths[i])) });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((c, ci) => cell(c, colWidths[ci], ri % 2 === 0 ? altShade : noShade))
  }));
  return new Table({ columnWidths: colWidths, rows: [hdrRow, ...dataRows] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { size: 48, bold: true, color: "1B3A5C", font: "Arial" }, paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: "1B3A5C", font: "Arial" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: "2E5E8E", font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: "3A7ABF", font: "Arial" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-features", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-usecases", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-todo", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "FLARM USB Updater \u2014 Design Document", size: 16, color: "999999", font: "Arial", italics: true })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }), new TextRun({ text: " of ", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "999999" })] })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("FLARM USB Updater")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Hardware Design Document", size: 28, color: "2E5E8E", font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "REV B", size: 24, bold: true, color: "1B3A5C", font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "PCB: 53.4 \u00D7 30.5 mm (2102 \u00D7 1200 mil), 2-layer FR4", size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "April 2026", size: 20, color: "666666" })] }),

      // 1. Overview
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Overview")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("The FLARM USB Updater is a USB-to-RS232 adapter with an integrated 12V boost converter, designed to update FLARM firmware and FLARM displays without requiring external power. It connects to a PC via USB-C and to the FLARM unit via an RJ45 cable following the IGC specification.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Key Features")] }),
      ...[
        "USB-C powered \u2014 no external 12V supply needed",
        "FT232RL USB-UART bridge (uses built-in Windows usbser.sys driver)",
        "MAX3232 RS232 level converter for FLARM communication",
        "MT3608 boost converter: 5V USB \u2192 12V FLARM power",
        "AMS1117-3.3 LDO for FLARM 3.3V pin",
        "USBLC6-2SC6 ESD protection on USB data lines",
        "3 status LEDs: power (green), TX (green), RX (yellow)",
        "TTL UART breakout header (J3) for direct TTL access",
        "All SMT, JLCPCB assembly compatible",
      ].map(t => new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.2 Use Cases")] }),
      ...["FLARM firmware updates (straight RJ45 cable)", "FLARM display updates (crossover RJ45 cable, pins 5+6 swapped)", "IGC flight log download", "FLARM configuration and live NMEA diagnostics", "General-purpose USB to RS232 adapter (cable with GND/TX/RX only)"].map(t => new Paragraph({ numbering: { reference: "num-usecases", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),

      // 2. Block Diagram
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. System Architecture")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("The design consists of five functional blocks:")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Power Supply")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Boost Converter (MT3608): ", bold: true }), new TextRun("Standard boost topology. L1 (22\u00B5H) sits between VUSB and SW node. MT3608 internal FET switches SW to GND; Schottky D1 (B5819W) conducts when FET opens, storing L1's magnetic energy into C3. Feedback divider R1 (100k\u03A9) / R2 (5.1k\u03A9) sets Vout = 0.6 \u00D7 (1 + R1/R2) \u2248 12.35V, yielding ~12.0V at RJ45 after the ~0.35V D1 drop. 22\u00B5H is the top of the MT3608 recommended range, chosen for lower peak current and output ripple at the ~85mA FLARM load.")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "LDO (AMS1117-3.3): ", bold: true }), new TextRun("Provides 3.3V from USB 5V for FLARM pin 3. R6 (10\u03A9) limits current between the LDO output and FLARM's internal 3.3V regulator to prevent backfeed.")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Power Budget: ", bold: true }), new TextRun("Classic FLARM draws ~85mA at 12V. Total USB current: ~280mA, well within any USB port's capability.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 USB Interface")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("USB-C connector (J1) with CC1/CC2 pull-down resistors (R4, R5: 5.1k\u03A9) for UFP sink identification. USBLC6-2SC6 (D2) provides ESD protection on D+/D- lines. Both USB-C orientations are supported.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 USB-UART Bridge")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("FT232RL (U1) converts USB to TTL UART. Chosen over CH340C because the November 2024 Windows Update broke CH340 drivers; FT232RL uses the built-in usbser.sys driver. CBUS0 (TXLED#) and CBUS1 (RXLED#) drive status LEDs via active-low outputs. Pin 26 (TEST) tied to GND. Unused modem control inputs (RI#, DSR#, DCD#, CTS#) tied to GND.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.4 RS232 Level Converter")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("MAX3232 (U2) converts TTL UART to RS232 levels. C5 is VCC bypass (pin 16). C6/C7 are the charge pump flying caps (C1\u00B1/C2\u00B1). C8/C9 are V+/V- storage caps. All five are 100nF, which is the MAX3232 datasheet value for 3V\u20135.5V operation. Channel 1 carries FLARM communication. Channel 2 is unused; T2IN (pin 10) is tied to GND to prevent floating-input oscillation; the other channel-2 pins are left floating (allowed by datasheet).")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.5 LED Indicators")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("All LEDs use the same topology: VUSB \u2192 LED anode (pin 1) \u2192 LED cathode (pin 2) \u2192 R \u2192 sink.")] }),
      ...["LED1 (green, KT-0805G): Power indicator. R7 (680\u03A9) to GND. Always on. I = (5-2.8)/680 = 3.2mA.", "LED2 (yellow, KT-0805Y): TX activity. R8 (680\u03A9) to TXLED (CBUS0). I = (5-2.1)/680 = 4.3mA when active.", "LED3 (yellow, KT-0805Y): RX activity. R9 (680\u03A9) to RXLED (CBUS1). I = (5-2.1)/680 = 4.3mA when active."].map(t => new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),

      // 3. RJ45 Pinout
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. RJ45 Pinout (IGC Specification)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Pin numbering follows the IGC GNSS FR specification. The SMD RJ45 connector (RJ-064-1) has reversed pad numbering (pad 1 = RJ45 pin 8), accounted for in the PCB routing.")] }),
      makeTable(["Pin", "Signal", "Notes"], rj45pins, [1200, 3600, 4560]),

      // 4. Net Names
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("4. Net Names")] }),
      makeTable(["Net Name", "Description"], nets, [2400, 6960]),

      // 5. BOM
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Bill of Materials")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("34 SMT components + 1 PTH (J3 unpopulated). 7 Extended parts (\u00D7 $3 = $21 setup fee). REV B removed R3 (EN pull-up \u2014 EN tied directly to VUSB), C2 (boost input HF), and C4 (boost output aux) \u2014 none required by the MT3608 datasheet.")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Estimated cost: 5 boards \u2248 $16.70/ea, 10 boards \u2248 $12.30/ea", bold: true, size: 20 })] }),
      makeTable(["Ref", "Part", "Description", "Package", "LCSC", "Class"], bom, [900, 2400, 2800, 1200, 1100, 960]),

      // 6. PCB
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. PCB Design")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Board: 53.4 \u00D7 30.5 mm (2102 \u00D7 1200 mil), 2-layer FR4, 1oz copper.", bold: true })] }),
      ...["GND copper pour on both layers; top pour fills gaps between traces, bottom is a solid GND plane", "All signal routing on top layer (single-sided routed) \u2014 bottom reserved for uninterrupted GND return", "54 vias for GND stitching and bottom-plane pad connections", "Net class rules: Power (VUSB) \u2265 20mil, Power_12V (V12_OUT) \u2265 15mil", "USB differential pair (UD+/UD-, UD_IN+/UD_IN-): 6mil/6mil width/space, diff-pair rule active", "Designed in EasyEDA Pro, assembled by JLCPCB"].map(t => new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),

      // 7. Design Decisions
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Key Design Decisions")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("FT232RL over CH340C")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("November 2024 Windows Update broke CH340 drivers. FT232RL uses the built-in usbser.sys driver, eliminating driver issues.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("USBLC6-2SC6 ESD Protection")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Aviation and workshop environments have significant ESD risk. The USBLC6-2SC6 protects USB data lines with minimal capacitance impact.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("22\u00B5H Inductor")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Top of the MT3608 recommended range (4.7-22\u00B5H). Chosen for lower peak inductor current and reduced output ripple at our light load (~85mA at 12V). The SMNR4020-22UH (4x4mm) fits the board.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("R6 Current Limiter (10\u03A9)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("FLARM outputs up to 200mA at 3.3V on pin 3 (per FLARM manual). Without R6, two LDO outputs would fight, causing uncontrolled current flow. R6 limits mismatch current to ~10mA max. AMS1117 handles backfeed safely with 22\u00B5F caps (no protection diode needed). Can be replaced with 0\u03A9 if display voltage drop is an issue.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("680\u03A9 LED Resistors")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("KT-0805G (green) has a maximum forward current of 5mA. With 680\u03A9: I = (5-2.8)/680 = 3.2mA, providing comfortable margin. Yellow LEDs run at 4.3mA. Both values produce adequate brightness (430mcd green, 175mcd yellow).")] }),

      // 8. Design Verification
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Changes from REV A")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("REV A was ordered, received, and bench-tested. RS232, USB, 3.3V rail, and LEDs all worked. The 12V boost rail produced 0V due to incorrect L1/D1 placement. REV B fixes this; a single other known issue (VCCIO on 5V) is deferred.")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Fixed in REV B")] }),
      ...[
        "Boost topology corrected \u2014 L1 now between VUSB and SW (was between SW and output); D1 now between SW and V12_OUT (was between boost output and V12_OUT). Standard textbook boost.",
        "Removed R3 (10k\u03A9 EN pull-up) \u2014 MT3608 EN tied directly to VUSB.",
        "Removed C2 (100nF boost input HF) \u2014 not required by datasheet; C1 (22\u00B5F) suffices.",
        "Removed C4 (4.7\u00B5F boost output aux) \u2014 not required by datasheet; C3 (22\u00B5F) suffices.",
        "VBOOST net eliminated \u2014 SW \u2192 D1 \u2192 V12_OUT is one continuous output path.",
        "LED2 colour corrected in documentation: KT-0805Y (yellow), matches physical BOM."
      ].map(t => new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Deferred (not fixed in REV B)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("FT232RL VCCIO (pin 4) is still tied to VUSB (5V). UART signals on the J3 header are 5V TTL. This is fine for MAX3232 (3\u20135.5V tolerant) and for 5V-tolerant external MCUs, but not safe for 3.3V-only targets via J3. Fix planned: tie VCCIO to FT_3V3 (pin 17) in a future revision. Low priority \u2014 main use case is the RS232 path to FLARM, unaffected by VCCIO voltage.")] }),

      // 9. Verification
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Design Verification (REV B)")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Netlist and BOM review completed 2026-04-20 against REV B EasyEDA project export:")] }),
      ...[
        "FT232RL: all 28 pins verified (TEST\u2192GND, CTS/DSR/DCD/RI\u2192GND, OSCI/OSCO NC, VCCIO on VUSB=5V)",
        "MAX3232: C5 is VCC bypass; C6/C7 charge pumps; C8/C9 V\u00B1 storage. Ch1 UART\u2194RS232, T2IN (pin 10) tied to GND",
        "MT3608: VUSB\u2192L1\u2192SW\u2192D1\u2192V12_OUT. Feedback 100k/5.1k gives 12.35V. Boost topology now correct",
        "USB-C: CC1/CC2 pulldowns 5.1k\u03A9, D+/D- through USBLC6 (diff-pair rule active), both orientations",
        "AMS1117: V3V3 \u2192 R6 (10\u03A9) \u2192 RJ45 pin 3, adequate headroom (1.7V)",
        "LED circuits: active-low CBUS, correct polarity, 3.2\u20134.3mA (LED2 now correctly yellow)",
        "RJ45 pinout matches FLARM IGC specification (SMD connector uses reversed pad numbering, compensated in routing)",
        "USB D+/D- configured as differential pair (DP1, DP2), 6mil/6mil",
        "GND pour both layers, 54 stitching vias",
        "Power budget: ~280mA within USB 2.0 500mA limit",
        "All capacitor voltage ratings \u22651.8\u00D7, all resistor power ratings <40%"
      ].map(t => new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] })),

      // 10. Status
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Status & Next Steps")] }),
      ...["REV B fabrication files exported (Gerber, BOM, Pick-and-Place) \u2014 ready for JLCPCB order", "Bring-up plan: verify 12V at RJ45 pins 1/2 with DMM before connecting FLARM", "Validate USB enumeration, TX/RX loopback via monitor_com11.py / poke_flarm.py", "Program FT232RL EEPROM via FT_PROG (device description, unique serial) \u2014 optional", "Future REV: move VCCIO to 3.3V (J3 header at 3.3V TTL for 3.3V-only targets)"].map(t => new Paragraph({ numbering: { reference: "num-todo", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t, size: 20 })] })),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("d:\\CodeProjects\\FLARM-USB-Updater\\Docs\\FLARM_USB_Updater_Design_Document.docx", buffer);
  console.log("Design document created successfully.");
});
