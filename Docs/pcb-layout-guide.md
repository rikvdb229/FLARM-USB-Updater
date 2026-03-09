# EasyEDA Pro — PCB Layout Guide
## FLARM USB Updater

---

## Board Specification

| Parameter | Value |
|-----------|-------|
| Size | 2000 × 950 mils (50.8mm × 24.1mm) — target after reduction |
| Current size | 2000 × 1200 mils (50.8mm × 30.5mm) |
| Layers | 2 (Top signal + component, Bottom GND pour) |
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
11. **LEDs + current resistors** — top edge or bottom edge, grouped

---

## 2. Board Layout Zone Map

```
┌──────────────────────────────────────────────────────────────────────┐ top edge
│  LED1  LED2  LED3   R6  R8  R9   (LED strip — top edge)              │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  BOOST ZONE: U3  L1  D1  R1 R2 R3  C1 C2 C3 C4              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────┐  ┌──────────────────┐  ┌───────────────┐  ┌──────────┐  │
│  │ USB-C  │  │   FT232RL (U1)   │  │  MAX3232 (U2) │  │   RJ45   │  │
│  │  J1    │  │  C10 C11 C12 C13 │  │  C5–C9  R7    │  │   RJ1    │  │
│  │  D2    │  │                  │  │               │  │          │  │
│  │ R4 R5  │  │                  │  │               │  │          │  │
│  │  C14   │  │                  │  │               │  │          │  │
│  └────────┘  └──────────────────┘  └───────────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────────────┘ bottom edge
 ←18mm→       ←──── 24mm ────→      ←── 18mm ──→      ←── 15mm ──→
```

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

## 6. Ground Pour — Bottom Layer Only

After routing all traces:

1. Place → Copper Pour (or shortcut: Shift+P)
2. Layer: **Bottom (B.Cu)**
3. Net: **GND**
4. Clearance: **8mil** (6mil minimum, 8mil recommended)
5. Fill mode: Solid
6. Click to draw outline covering the full board outline
7. Press Enter / double-click to close → EasyEDA fills automatically

**Via stitching:**
- After pour is placed: add vias on GND net every 6–8mm across the board
- Especially important: around the boost converter, near USB connector, along board edges
- Via size: 0.8mm drill, 1.2mm pad (JLCPCB minimum is 0.3mm drill)
- EasyEDA: Place → Via → set net to GND → place around the board

**Do NOT add top layer copper pour** — risk of tombstoning on 0402 passives during reflow.

---

## 7. Board Outline Reduction

### Current: 2000 × 1200 mils → Target: 2000 × 950 mils

Before resizing, verify the RJ45 footprint height:
- Open RJ1 footprint → measure courtyard height
- If courtyard ≤ 23mm: 950 mil board height works
- If courtyard > 23mm: use 1050 mils (26.7mm) as safe minimum

### How to resize in EasyEDA Pro
1. Click the board outline rectangle
2. Properties → change Height from 1200 to 950 (or target value)
3. Verify all component courtyards are ≥ 0.5mm inside the new outline
4. Drag any components that now violate the edge clearance inward

---

## 8. Routing Order

Route in this order to avoid having to re-route:

1. **VUSB** — from J1 VBUS pins → C1 → C14 → U1 VCC → U2 VCC → U3 VIN (20mil)
2. **GND** — short star connections from each IC GND pin to a central via (bottom pour handles the rest)
3. **Boost switching loop** — SW → L1 → D1 → VBOOST (20mil)
4. **V12_OUT** — D1 cathode → C3/C4 → R1 top → RJ1 pins 1&2 (15mil)
5. **D+/D−** — J1 → D2 → U1 as differential pair (10mil matched)
6. **UART_TX / UART_RX** — U1 → U2 (10mil)
7. **RS232_TX / RS232_RX** — U2 → RJ1 pins 5&6 (10mil)
8. **V3V3 / R7** — U4 Vout → R7 → RJ1 pin 3 (10mil)
9. **LED nets** — TXLED / RXLED from U1 → LED cathodes (10mil)
10. **Power LEDs** — VUSB → R6/R8/R9 → LED anodes (10mil)
11. **Feedback divider** — VBOOST → R1 → R2 → GND, junction → U3 FB (10mil)
12. **CC pull-downs** — J1 CC1/CC2 → R4/R5 → GND (10mil)
13. **Add GND copper pour** (bottom layer)
14. **Add via stitching** (GND net, every 6–8mm)
15. **Run DRC** — fix all violations

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
- [ ] GND vias stitched every 6–8mm
- [ ] All component courtyard clearances ≥ 0.5mm from board edge
- [ ] Board outline correct (2000 × 950 mils or confirmed size)
- [ ] Schematic: TEST, CTS#, DSR#, DCD# all tied to GND
- [ ] Mounting holes placed at opposite corners (M2.5, GND net)
- [ ] Test points TP1–TP5 placed and labeled
- [ ] Silkscreen: board name, connector labels, LED labels, voltage warnings
- [ ] Breakout header J3 (1×3 TTL UART) placed along bottom edge with labels
- [ ] Gerber export: all layers including drill file
- [ ] JLCPCB online Gerber viewer shows no missing copper or short circuits
