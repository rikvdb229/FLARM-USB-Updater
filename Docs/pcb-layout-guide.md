# EasyEDA Pro — PCB Layout Guide
## FLARM USB Updater

---

## Board Specification

| Parameter | Value |
|-----------|-------|
| Size | 55mm × 28mm (2165 × 1102 mil) — target |
| Current size | 2000 × 1200 mils (50.8mm × 30.5mm) |
| Layers | 2 (Top signal + component, Bottom GND pour, Top GND fill) |
| Copper weight | 1oz (35µm) |
| Min trace/space | 6/6 mil (0.15mm/0.15mm) JLCPCB standard |
| Surface finish | HASL or ENIG |

---

## 0. Before You Route — Schematic Verification Checklist

Open the schematic and verify these before touching the PCB:

- [ ] **U1 TEST pin → GND** *(MANDATORY — TEST=1 disables the FT232RL entirely)*
- [ ] **U1 CTS# → GND** *(prevents Windows COM port hang in some terminal apps)*
- [ ] **U1 DSR# → GND**
- [ ] **U1 DCD# → GND**
- [ ] **U1 RESET#** → NC (internal pull-up, internal POR sufficient)
- [ ] U2 T2IN → GND ✅ *(confirmed in netlist)*
- [ ] All charge pump caps C6–C9 connected ✅
- [ ] CC1 (R4) and CC2 (R5) on correct USB-C pins ✅

---

## 1. Component Placement Order

Always place in this order — connectors first, then ICs, then passives:

1. **J1 (USB-C)** — flush left edge, connector overhangs board edge ~3mm
2. **RJ1 (RJ45)** — flush right edge, connector overhangs ~3mm
3. **U1 (FT232RL SSOP-28)** — center-left zone; orient USBDP/USBDM pins facing left toward J1
4. **U2 (MAX3232 SOIC-16)** — center-right zone; orient T1IN/R1OUT facing left toward U1
5. **U3 (MT3608 SOT-23-6)** — top strip; SW pin (pin 1) facing toward L1
6. **L1 (22µH inductor)** — adjacent to U3 SW pin, within 3mm
7. **D1 (B5819W)** — between L1 output and C3, keep inline with boost current path
8. **D2 (USBLC6-2SC6)** — between J1 and U1, on D+/D− path
9. **All decoupling caps** — within 1–2mm of their respective IC power pins (before routing)
10. **Boost passives** R1, R2, R3, C1–C4 — around U3/L1/D1 cluster
11. **U4 (AMS1117-3.3)** — near RJ45, short path to pin 3
12. **LEDs + current resistors** — top-right edge, grouped

---

## 2. Board Layout Zone Map

```
55mm
┌────────────────────────────────────────────────────────────────┐
│                    BOOST ZONE (top-left)              LEDs     │
│  ┌─────────────────────────────────┐         LED1 LED2 LED3   │
│  │ U3  L1  D1   R1 R2 R3          │         R6   R8   R9     │  28mm
│  │ C1 C2   C3 C4                   │                          │
│  └─────────────────────────────────┘                          │
│                                                                │
│ ┌──────┐  ┌────────────────┐  ┌──────────────┐  ┌──────────┐ │
│ │USB-C │  │   FT232RL      │  │   MAX3232    │  │  RJ45    │ │
│ │ J1   │  │   U1           │  │   U2         │  │  J2      │ │
│ │      │  │ C10 C11 C12 C13│  │ C5 C6-C9     │  │          │ │
│ │ D2   │  │                │  │              │  │  U4      │ │
│ │R4 R5 │  │                │  │              │  │ C15 C16  │ │
│ │ C14  │  │     J3 (bot)   │  │         R7   │  │          │ │
│ └──────┘  └────────────────┘  └──────────────┘  └──────────┘ │
│  MH1                    TP1-5                           MH2   │
└────────────────────────────────────────────────────────────────┘
```

### Placement principles
- Connectors on opposite edges (USB-C left, RJ45 right)
- Signal flow left-to-right: USB → FT232RL → MAX3232 → RJ45
- Boost converter isolated in top-left zone (away from USB data lines)
- LDO (U4) near RJ45 for short path to pin 3
- LEDs along top-right edge for visibility
- All components on TOP layer

---

## 3. Trace Width Rules

| Net | Max Current | Min Width | Use This Width |
|-----|------------|-----------|----------------|
| VUSB | 500mA | 15mil | **20mil** |
| VBOOST | ~2A peak | 20mil | **20mil** |
| $1N2860 (SW node) | ~2A peak | 20mil | **20mil** |
| V12_OUT | 380mA | 10mil | **15mil** |
| UART_TX / UART_RX | <1mA | 6mil | 10mil |
| RS232_TX / RS232_RX | <1mA | 6mil | 10mil |
| UD+ / UD− | signal | 6mil | 10mil (matched pair — see §4) |
| LED nets | 3mA | 6mil | 10mil |
| GND | all combined | pour | Bottom layer copper pour |

**How to set in EasyEDA Pro:**
1. Design → Design Rule → Net Class
2. Create a class "POWER" → assign nets: VUSB, VBOOST, $1N2860 → Width 20mil
3. Create a class "POWER_12V" → assign net: V12_OUT → Width 15mil
4. Or: after routing, select a power trace → right-click → Select Net → change width

---

## 4. D+/D− Equal-Length Differential Pair Routing

This is the most important signal-integrity item on this board.

### Why it matters
USB D+ and D− are a differential pair. If one trace is longer than the other, the signal arrives skewed — this causes bit errors. USB 2.0 Full Speed (12 Mbps) tolerates up to ~80mm mismatch, but keep it under 1mm for clean operation.

### Routing path
```
J1 (USBC1) ──── D2 (USBLC6) ──── U1 (FT232RL)
  A6/B6 (UD+)    pin 1/6          USBDP
  A7/B7 (UD−)    pin 3/4          USBDM
```

### How to do it in EasyEDA Pro

**Option A — Differential Pair Router (preferred):**
1. Delete any existing D+/D− traces
2. Route → Interactive Router → check "Differential Pair" in toolbar
3. Click UD+ at J1, drag — EasyEDA routes both D+ and D− simultaneously
4. Route from J1 → D2 → U1 in one continuous differential pair
5. Keep pair spacing ≤ 6mil (traces touching is fine for USB 2.0)

**Option B — Manual with length matching:**
1. Route D+ from J1 → D2 → U1 normally (10mil)
2. Route D− the same path
3. Select each trace → Properties → note "Length"
4. If mismatch > 20mil: add a small serpentine (meander) on the shorter trace
   - Insert → Trace → draw zigzag loops to add length

### Rules
- Both traces on **same layer** — no vias on D+/D−
- Keep ≥ **3mm clearance** from boost converter SW node ($1N2860)
- Keep ≥ **2mm clearance** from RS232 lines
- Total route length: typically 15–20mm on this board

---

## 5. Boost Converter Layout (EMI Critical)

The MT3608 switches at 1.2MHz. Poor layout creates radiated noise that can corrupt USB data.

### Switching loop — minimise enclosed area

```
        VUSB
          │
     ┌────┴────┐
     │  U3     │ SW pin (pin 1)
     │ MT3608  ├──────────── L1 ──────── D1 ──── VBOOST
     │         │             22µH      B5819W      │
     └────┬────┘                                  C3 C4
          │ GND                                    │
          └────────────────────────────────────────┘
```

### Placement rules
- **U3 → L1 SW trace: ≤ 5mm, width 20mil** — this is the highest-priority trace
- L1 output → D1 anode: ≤ 5mm, width 20mil
- D1 cathode → C3: ≤ 5mm, width 20mil
- R1 and R2 (feedback divider): within 5mm of U3 FB pin (pin 3)
- C1, C2 (input caps): within 3mm of U3 VIN pin (pin 5)
- **No signal traces through the boost zone** — keep USB and RS232 on the opposite side
- Place a GND via directly adjacent to U3 GND pin (pin 2) — connects top GND pad to bottom GND pour

---

## 6. Ground Pour — Both Layers

After routing all traces:

### Bottom Layer GND Pour (primary ground return)
1. Place → Copper Pour (or shortcut: Shift+P)
2. Layer: **Bottom (B.Cu)**
3. Net: **GND**
4. Clearance: **8mil** (6mil minimum, 8mil recommended)
5. Fill mode: Solid
6. Click to draw outline covering the full board outline
7. Press Enter / double-click to close → EasyEDA fills automatically

### Top Layer GND Pour (fills empty space)
1. Place → Copper Pour
2. Layer: **Top (F.Cu)**
3. Net: **GND**
4. Clearance: **10mil** (slightly larger to avoid solder bridging on 0402 pads)
5. Fill mode: Solid
6. Cover entire board outline
7. Priority: lower than bottom pour

> The top layer GND pour fills empty space around signal traces, improving EMI shielding
> and thermal dissipation. The 10mil clearance prevents solder bridging risk on 0402 passives.

### GND Routing Strategy
- **Every GND pad gets a short stub (≤3mm) to a via → bottom pour handles the rest**
- Do NOT route long GND traces on the top layer
- Each decoupling cap GND pin gets its own dedicated GND via

### Via stitching
- After pour is placed: add vias on GND net every 6–8mm across the board
- Especially important: around the boost converter, near USB connector, along board edges
- Via size: 0.3mm drill, 0.6mm pad (JLCPCB standard)
- EasyEDA: Place → Via → set net to GND → place around the board

---

## 7. Board Size

### Target: 55mm × 28mm (2165 × 1102 mil)

USB-C is ~9mm wide, RJ45 is ~16mm wide and ~13mm deep. FT232RL SSOP-28 is ~10mm body.
With boost converter zone on top, 28mm height accommodates all zones. Width of 55mm gives
room for signal chain USB-C → FT232RL → MAX3232 → RJ45 plus boost on top.

If components don't fit at 28mm height, increase to 30mm. Board can be wider (up to 60mm)
if needed for cleaner routing — prefer clean routing over smaller board.

### How to resize in EasyEDA Pro
1. Click the board outline rectangle
2. Properties → change dimensions to 55mm × 28mm
3. Verify all component courtyards are ≥ 0.5mm inside the new outline
4. Drag any components that now violate the edge clearance inward

---

## 8. Routing Order

Route in this exact order. GND pads are NOT routed as traces — each gets a short stub to a via, then the copper pour handles the rest.

### Priority 1: Power Rails (20mil)
1. **VUSB** — J1 VBUS → star topology to: C1/C2 (U3 VIN), C14 (D2), U1 VCC+C10/C11, U1 VCCIO+C13, U2 VCC+C5, U4 VIN+C15, R3 (EN), R6/R8/R9 (LEDs)

### Priority 2: Boost Switching Loop (20mil, CRITICAL — minimize loop area)
2. **SW ($1N2860)** — U3 SW (pin 1) → L1 (≤5mm, 20mil)
3. **VBOOST** — L1 output → D1 anode (≤5mm, 20mil), also to C3/C4 and R1 top (FB divider)

### Priority 3: 12V Output (15mil)
4. **V12_OUT** — D1 cathode → C3/C4 positive → J2 pins 1,2 (route along top edge)

### Priority 4: GND Connections (stub + via only)
5. **GND** — Every GND pad gets a short stub (≤3mm) to a via to bottom pour:
   - U3 GND (pin 2) — via directly at pad
   - U1 GND pins (7, 18, 21) — short stubs to vias
   - U2 GND (pin 15) — via at pad
   - U4 GND tab — via at pad (SOT-223 tab is GND)
   - J1 shield/GND — multiple vias near connector
   - J2 GND pins (4, 7, 8) + shield — multiple vias
   - R2 bottom, R4, R5 — via to GND
   - All decoupling cap GND pins — each cap gets its own GND via
   - LED cathodes (LED1 via R6) — via to GND

### Priority 5: USB Differential Pair (10mil, matched)
6. **UD+ / UD−** — J1 → D2 → U1, differential pair (6mil spacing)
   - TOP layer only, no vias on D+/D−
   - ≥3mm from boost SW node, ≥2mm from RS232 lines
   - Match lengths within 20mil

### Priority 6: UART Signals (10mil)
7. **UART_TX** — U1 TXD (pin 1) → U2 T1IN (pin 11), branch to J3 pin 1
8. **UART_RX** — U2 R1OUT (pin 12) → U1 RXD (pin 5), branch to J3 pin 2

### Priority 7: RS232 Signals (10mil)
9. **RS232_TX** — U2 T1OUT (pin 14) → J2 pin 6 (keep ≥2mm from USB)
10. **RS232_RX** — J2 pin 5 → U2 R1IN (pin 13)

### Priority 8: LDO Path (10mil)
11. **V3V3** — U4 Vout → C16 → R7 → J2 pin 3

### Priority 9: LED Drive Signals (10mil)
12. **TXLED** — U1 CBUS0 (pin 23) → LED2 cathode
13. **RXLED** — U1 CBUS1 (pin 22) → LED3 cathode
14. **LED anodes** — R6→LED1, R8→LED2, R9→LED3

### Priority 10: Remaining Passives (10mil)
15. **FB divider** — R1-R2 junction → U3 FB (pin 3), keep short and away from SW
16. **EN** — R3 → U3 EN (pin 4)
17. **CC pull-downs** — J1 CC1/CC2 → R4/R5 → GND via
18. **MAX3232 charge pump caps** — C6-C9 short stubs to respective U2 pins
19. **FT232RL internal** — 3V3OUT (pin 17) → C12, TEST (pin 26) → GND via, CTS#/DSR#/DCD# → GND via

### Final Steps
20. **Add bottom GND copper pour** (8mil clearance)
21. **Add top GND copper pour** (10mil clearance)
22. **Add via stitching** (GND net, every 6–8mm, especially around boost zone and USB connector)
23. **Run DRC** — fix all violations
24. **Verify D+/D− length matching**
25. **Verify boost loop is compact** (U3→L1→D1→C3 total ≤15mm)

---

## 9. JLCPCB Design Rule Settings

Before generating Gerbers, run DRC with these constraints:

| Rule | JLCPCB Minimum | Set To |
|------|---------------|--------|
| Min trace width | 0.127mm (5mil) | 0.127mm |
| Min clearance | 0.127mm (5mil) | 0.127mm |
| Min drill hole | 0.3mm | 0.3mm |
| Min annular ring | 0.15mm | 0.15mm |
| Board edge clearance | 0.3mm | 0.5mm |
| Courtyard clearance | — | 0.2mm (manual check) |

---

## 10. Mounting Holes

Add 2× plated mounting holes at opposite corners (top-left and bottom-right, or top-right and bottom-left). These allow securing the board with standoffs in a case or to a surface.

| Parameter | Value |
|-----------|-------|
| Hole size | M2.5 (2.5mm drill, 4.5mm pad) |
| Net | GND (connects shield to ground plane) |
| Clearance from board edge | ≥ 1.5mm from pad edge to board outline |
| Placement | ≥ 3mm from nearest component courtyard |

**In EasyEDA Pro:** Place → Pad → set drill to 2.5mm, pad to 4.5mm, shape Round, net GND. Place at opposite corners inside the board outline.

---

## 11. Test Points

Add small test pads for first-board bring-up with a multimeter. Costs nothing in BOM, negligible PCB space.

| Test Point | Net | Expected Voltage |
|------------|-----|-----------------|
| TP1 | VUSB | 5.0V |
| TP2 | VBOOST | ~12.4V |
| TP3 | V12_OUT | ~12.0V |
| TP4 | V3V3 | 3.3V |
| TP5 | GND | 0V (probe reference) |

**In EasyEDA Pro:** Place → Pad → 1.0mm round pad, no drill (SMD), assign net. Place in a row along a board edge where they won't interfere with components. Label each with its net name in silkscreen.

---

## 12. Breakout Header (J3)

One through-hole header for optional hand-soldering. Leave unpopulated on assembled boards.

**J3 — TTL UART (1×3, 2.54mm pitch)**
- Place near U1 (FT232RL), along the bottom board edge
- Pin labels in silkscreen: `TX`, `RX`, `GND`
- Pads: 1.0mm drill, 1.8mm pad, 2.54mm pitch

**In EasyEDA Pro:** Place → Pad → set drill 1.0mm, pad 1.8mm, shape Round. Place 3 pads at 2.54mm spacing for J3. Assign nets manually. Add silkscreen text labels.

> This header is not in the JLCPCB BOM — it is hand-soldered when needed.
> MAX3232 channel 2 is unused (no MCU on board to drive it) — all channel 2 pins are no-connect.

---

## 13. Silkscreen Design

Add these labels to the top silkscreen layer:

- **Board identity**: `FLARM USB Updater v1.0` (center of board or near title area)
- **Connector labels**: `USB` near J1, `FLARM` near J2
- **LED labels**: `PWR`, `TX`, `RX` next to LED1, LED2, LED3
- **Voltage warning**: `12V` near RJ45 pins 1,2 area
- **Pin 1 dots**: on all IC packages (U1–U4)
- **Polarity marks**: `+` on polarized caps (C1, C3, C10, C15, C16) and D1 cathode band

**Text size:** minimum 0.8mm height / 0.15mm line width for JLCPCB legibility.

---

## 14. Pre-Order Checklist

- [ ] DRC passes with zero violations
- [ ] D+ and D− trace lengths within 20mil of each other
- [ ] VUSB, VBOOST, SW traces all ≥ 20mil wide
- [ ] V12_OUT traces ≥ 15mil wide
- [ ] Boost switching loop (U3→L1→D1→C3) is tight and compact
- [ ] No signal traces routed through boost converter zone
- [ ] Bottom layer GND copper pour covers full board, clearance 8mil
- [ ] Top layer GND copper pour fills empty space, clearance 10mil
- [ ] All GND pads connect via short stub → via → bottom pour (no long GND traces)
- [ ] GND vias stitched every 6–8mm
- [ ] All component courtyard clearances ≥ 0.5mm from board edge
- [ ] Board outline correct (55mm × 28mm or confirmed size)
- [ ] Schematic: TEST, CTS#, DSR#, DCD# all tied to GND
- [ ] Mounting holes placed at opposite corners (M2.5, GND net)
- [ ] Test points TP1–TP5 placed and labeled
- [ ] Silkscreen: board name, connector labels, LED labels, voltage warnings
- [ ] Breakout header J3 (1×3 TTL UART) placed along bottom edge with labels
- [ ] Gerber export: all layers including drill file
- [ ] JLCPCB online Gerber viewer shows no missing copper or short circuits
