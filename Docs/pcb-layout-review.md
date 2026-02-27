# PCB Layout Review — Supplementary Findings
## FLARM USB Updater — Based on `pcb_decoded.json` and `schematic_decoded.json`

This document covers findings **not already addressed** in:
- `design-review-and-improvements.md` (schematic + pin verification)
- `power-analysis-options.md` (power budget + boost converter alternatives)

---

## CRITICAL: Boost Converter Inductor Placement

### What the Netlist Shows

The exported netlist from EasyEDA has these connections:

```
MT3608 (U3):
  Pin 1 (SW)  = $1N2860
  Pin 5 (IN)  = VUSB

L1 (SMNR4020-22UH):
  Pin 1 = $1N2860   (= MT3608 SW)
  Pin 2 = VBOOST

D1 (B5819W):
  Pin 1 = V12_OUT   (cathode → RJ45)
  Pin 2 = VBOOST    (anode ← L1)

C3, C4:     on VBOOST (before D1)
R1/R2 (FB): sense VBOOST (before D1)
```

This gives the following topology:

```
VUSB ─── MT3608 IN (pin 5, IC power only)

MT3608 SW (pin 1) ─── L1 ─── VBOOST ─── D1 ─── V12_OUT ─── RJ45
         │                       │
    [Internal MOSFET]      C3, C4, R1/R2
         │                  (caps + FB)
        GND
```

### What the MT3608 Datasheet Requires

The MT3608 datasheet application circuit specifies:

```
VUSB ─── L1 ─── SW (pin 1) ─── D1 ─── VOUT
  │                  │                    │
 IN (pin 5)    [Internal MOSFET]    COUT, FB divider
                     │
                    GND
```

Pin 1 (SW) description: *"Power switching output. Connect the inductor from
the **input** of the converter to this pin."*

### The Discrepancy

| Connection | This Design | MT3608 Datasheet |
|------------|-------------|------------------|
| L1 goes from... | SW → VBOOST (output side) | **VUSB → SW (input side)** |
| D1 anode at... | VBOOST (separate from SW) | **SW node (same as L1/SW junction)** |
| Output caps at... | VBOOST (before D1) | **VOUT (after D1)** |
| FB divider senses... | VBOOST (before D1) | **VOUT (after D1)** |

In the standard boost topology, **L1, SW pin, and D1 anode share the same node**.
In this design, L1 is between SW and D1 anode, creating a separate node ($1N2860)
that only connects to the MT3608 internal switch and one end of L1.

### Why This Matters

When the MT3608's internal MOSFET turns ON:
- Standard circuit: VIN → L1 → SW → GND (inductor charges from VIN)
- This circuit: no current path from VIN through L1 (VUSB doesn't connect to L1)

The inductor cannot store energy from the input supply. The boost converter
**cannot function** with L1 on the wrong side of the switch.

### Required Verification

**Open the schematic in EasyEDA and visually confirm:**

1. Does L1 connect between VUSB and the SW/D1 node? It should.
2. Are the SW pin, L1 output, and D1 anode all on the same net? They should be.
3. Are C3/C4 and the FB divider sensing after D1 (the actual output)? They should be.

### Correct Wiring

The fix requires reconnecting L1 in the schematic:

```
BEFORE (current — wrong):
  U3 SW (pin 1) ── L1 ── VBOOST ── D1 ── V12_OUT

AFTER (correct):
  VUSB ── L1 ── VBOOST ── D1 ── V12_OUT
                   │
              U3 SW (pin 1)
```

Specifically:
1. Disconnect L1 pin 1 from MT3608 SW ($1N2860)
2. Connect L1 pin 1 to VUSB
3. Connect L1 pin 2 to a junction node with MT3608 SW and D1 anode
4. Keep C3/C4 on that same junction node (they're fine where they are if the
   junction is the SW/D1 node — but ideally move to after D1 per datasheet)
5. Keep R1/R2 FB divider on that same junction (or move to after D1 to sense
   the actual output voltage — see note below)

**Note on FB and output cap placement:** The datasheet places the output
capacitors and FB divider **after** D1 (sensing the actual output). In the
current design they sense VBOOST (before D1), so the output voltage is
~0.36V lower than calculated. This is already accounted for in the design
review (12.36V − 0.36V = 12.0V). Either placement can work, but after-D1
is standard practice and provides better load regulation.

### Note on the Schematic Drawing Guide

The `schematic-drawing-guide.md` Section 6 contains the same error:

```
U3 SW   ── L1 one side
L1 other side ── net label VBOOST
```

This should be corrected to:

```
VUSB    ── L1 one side
L1 other side ── junction of U3 SW and D1 anode (net label VBOOST)
```

---

## PCB Layout Findings

### 1. GND Stitching Vias — Insufficient

**Finding:** Only 5 GND stitching vias on the entire board:

| Via | Position (mils) | Nearest IC |
|-----|----------------|------------|
| e20740 | (-334, -295) | U3 (MT3608), ~150 mil |
| e20741 | (-394, -235) | U3 (MT3608), ~200 mil |
| e20742 | (-484, 228) | U1 (FT232RL), ~120 mil |
| e20743 | (3, 478) | U2 (MAX3232), ~200 mil |
| e20744 | (-724, 150) | USB-C connector |

The bottom layer has a solid GND pour (POUR1) covering the full board, but
5 vias is insufficient to connect it effectively to top-layer GND traces.

**Recommendation:** Add 10–15 more GND vias:
- 2–3 vias within 50 mil of MT3608 GND pin (thermal relief + return current)
- 1 via near D1 cathode (heat sinking)
- 2–3 vias under/adjacent to FT232RL GND pins
- 1 via near MAX3232 GND pin
- 4–5 vias along board edges (every ~300 mil) for pour stitching

### 2. FT232RL Bypass Capacitor Distance

**Finding:** The FT232RL (U1) is at position (-386, 312). Its bypass
capacitors are at:

| Cap | Position | Distance to U1 | Net |
|-----|----------|----------------|-----|
| C10 (4.7µF) | (-334, -39) | ~350 mil (8.9mm) | VUSB |
| C11 (100nF) | (-249, 2) | ~330 mil (8.4mm) | VUSB |
| C12 (100nF) | (-111, 3) | ~390 mil (9.9mm) | 3V3OUT |
| C13 (100nF) | (-248, -88) | ~410 mil (10.4mm) | VUSB |
| C14 (100nF) | (-176, -89) | ~440 mil (11.2mm) | VUSB |

All bypass caps are 8–11mm from the FT232RL. The FTDI datasheet recommends
100nF capacitors "as close as possible" to VCC (pin 20) and VCCIO (pin 4).

At 8mm trace length, the inductance (~8nH) reduces decoupling effectiveness
at high frequencies. For USB 2.0 Full Speed (12 Mbps), this is adequate but
not optimal.

**Recommendation:** In a layout revision, move at least two 100nF caps
directly adjacent to U1: one near pin 20 (VCC) and one near pin 4 (VCCIO).

### 3. Boost Converter SW Node Trace

**Finding:** The $1N2860 (SW) trace runs ~5mm (200 mil) from L1 to U3 via
two diagonal segments on the top layer (20 mil width). The SW node carries
the highest dV/dt signal on the board (0V to ~12V at 1.2 MHz with ~10ns
edges).

**Assessment:** 5mm is acceptable for 1.2 MHz but not optimal. The trace
creates a small loop antenna radiating at 1.2 MHz harmonics.

**Recommendation (low priority):** In a layout revision, place L1 closer to
U3 with a direct, wide trace (≤3mm). After fixing the inductor wiring (see
Critical section above), the SW node topology changes and a fresh layout of
the boost converter section is advisable anyway.

### 4. Silkscreen Designator Mismatch

**Finding:** The RJ45 connector is "J1" in the schematic but "RJ1" on the
PCB (component e29). All other components use consistent designators.

**Recommendation:** Rename to match. Either:
- Change PCB designator to "J1" (matches schematic), or
- Change schematic designator to "RJ1" (more descriptive)

### 5. Board Dimensions and Mechanical

**Board size:** 2000 × 1200 mil (50.8mm × 30.5mm)

**Mounting holes:** None present. The USB-C and RJ45 connectors provide
some mechanical retention, but for vibration-prone environments (cockpit),
mounting holes improve reliability.

**Recommendation:** Add 2× M2 (2.2mm drill) mounting holes at opposite
corners, away from traces. These also serve as enclosure attachment points.

### 6. Test Points — None Present

No test pads exist on the board. For debugging during bring-up, add 1mm
round unmasked pads for:

| Signal | Priority | Purpose |
|--------|----------|---------|
| V12_OUT | HIGH | Verify boost output |
| VUSB | HIGH | Verify USB input |
| 3V3OUT | MEDIUM | Verify FT232RL LDO |
| GND | HIGH | Probe reference |

Place along a board edge accessible with oscilloscope probes.

---

## Items Confirmed Good (No Action Needed)

| Item | Assessment |
|------|-----------|
| C3, C4 voltage rating | **25V** (CL21A226MAQNNNE = C45783). 2× margin for 12V node. |
| Input caps (C1 22µF + C2 100nF) | Adequate. 25V rated at 5V bias → ~18µF effective. |
| RS232 trace routing | TX/RX ~50 mil apart on parallel run. Fine for 19200 baud. |
| RJ45 shield grounding | Pins 9/10 both to GND. Correct for this application. |
| FT232RL EEPROM | Internal EEPROM sufficient. No external 93C46 needed. |
| Power-on sequencing | MT3608 and FT232RL both start with VUSB. No conflict. |
| EMI separation | Boost converter (bottom-left) well-separated from USB data and RS232 areas. |
| USB D+/D- routing | Covered in detail in design-review-and-improvements.md §3. Excellent. |

---

## Summary — Priority Actions

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| **1** | **L1 inductor placement** | **CRITICAL** | Verify in EasyEDA. L1 must go from VUSB to SW/D1 node, not from SW to VBOOST. |
| 2 | GND stitching vias | MEDIUM | Add 10–15 more vias, especially near ICs |
| 3 | FT232RL bypass cap distance | MEDIUM | Move 2× 100nF caps adjacent to U1 pins 4 and 20 |
| 4 | Test points | MEDIUM | Add pads for V12_OUT, VUSB, 3V3OUT, GND |
| 5 | Mounting holes | LOW | Add 2× M2 at opposite corners |
| 6 | RJ45 designator mismatch | LOW | Rename J1/RJ1 for consistency |
| 7 | SW trace length | LOW | Shorten in next layout revision |
