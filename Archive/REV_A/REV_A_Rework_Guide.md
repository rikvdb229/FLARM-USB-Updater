# REV A Rework Guide — Boost Converter Fix

**Board:** FLARM USB Updater REV A
**Issue:** MT3608 boost converter produces 0V — L1 and D1 are in the wrong position
**Fix:** Desolder L1 and D1, resolder with correct topology

## Bug

The inductor (L1) is between SW and VBOOST. It must be between VUSB and SW.
The diode (D1) is between VBOOST and V12_OUT. It must be between SW and VBOOST.

**Before (wrong):**
```
VUSB ── IN    SW ── L1 ── VBOOST ── D1 ── V12_OUT
```

**After (correct):**
```
VUSB ── L1 ── SW ── D1 ── V12_OUT
                             │
                        C3, C4, R1/R2
```

## Tools needed

- Soldering iron with fine tip
- Hot air station (or second iron for D1)
- Flux
- 30 AWG wire or thin enameled wire
- Tweezers
- Kapton tape
- Multimeter
- Solder wick or desoldering braid

## Components involved

| Ref | Part | Package | Notes |
|-----|------|---------|-------|
| L1 | SMNR4020 22µH | 4.0 x 4.0 mm | Non-polarized, either orientation |
| D1 | B5819W SL | SOD-123 | Anode = unmarked end, Cathode = bar marking |

## Rework steps

### Step 1 — Desolder L1

1. Apply flux around L1 (4x4mm shielded inductor)
2. Heat with hot air at ~350°C or use iron on both pads alternately
3. Lift L1 off with tweezers
4. Clean pads with solder wick
5. Set L1 aside — it will be reused

### Step 2 — Desolder D1

1. Apply flux around D1 (SOD-123, near L1)
2. Heat with hot air or use two irons on both pads simultaneously
3. Lift D1 off with tweezers
4. Clean pads with solder wick
5. Set D1 aside — it will be reused

### Step 3 — Bridge D1's empty pads

Solder a short wire or solder blob across D1's two empty pads. This connects
V12_OUT directly to the VBOOST net (C3, C4, R1 feedback divider), which is the
output of the boost converter.

**Verify with multimeter:** continuity between V12_OUT (RJ45 pins 1&2) and
C3 positive pad.

### Step 4 — Solder L1 with flying wires

1. Cut two pieces of 30 AWG wire, ~15mm each
2. Solder one wire to each pad of L1 (either orientation — inductor is non-polarized)
3. Solder wire A to **VUSB**: use C1 positive pad (22µF cap near MT3608 IN pin)
4. Solder wire B to **MT3608 pin 1 (SW)**: top-left corner pin of U3 (SOT-23-6)

**Verify with multimeter:**
- Continuity from L1 wire A to USB-C VBUS (pin A4/B4)
- Continuity from L1 wire B to MT3608 pin 1 only (no short to other pins)

### Step 5 — Solder D1 with flying wires

1. Cut two pieces of 30 AWG wire, ~15mm each
2. Identify D1 polarity: cathode has a **bar marking** on the package
3. Solder one wire to each end of D1
4. Solder **anode** wire to **MT3608 pin 1 (SW)** — same point as L1 wire B
5. Solder **cathode** wire to **VBOOST/V12_OUT**: use C3 positive pad

**Verify with multimeter (diode mode):**
- Red probe on SW (MT3608 pin 1), black probe on C3 positive → should read ~0.2–0.4V (forward drop)
- Reverse probes → should read OL (open)

### Step 6 — Secure flying components

1. Tack L1 and D1 to the board with a small piece of Kapton tape
2. Ensure no wire-to-wire shorts between L1 and D1 leads
3. Route wires so they don't cross or touch other components

## Pre-power verification checklist

Run these multimeter checks BEFORE plugging in USB:

- [ ] No short between VUSB and GND
- [ ] No short between V12_OUT and GND
- [ ] Continuity: L1 wire A → VUSB rail
- [ ] Continuity: L1 wire B → MT3608 pin 1
- [ ] Continuity: D1 cathode → C3 positive / V12_OUT
- [ ] Continuity: D1 anode → MT3608 pin 1
- [ ] Diode check: SW → V12_OUT reads 0.2–0.4V forward
- [ ] D1 empty pads bridged: V12_OUT → C3 positive continuity
- [ ] No solder bridges on MT3608 (check all 6 pins)

## Power-on test

1. Plug in USB-C cable to a USB port (not a charger)
2. LED1 (green, power) should light up
3. Measure V12_OUT at RJ45 pins 1&2 relative to GND (pins 4/7/8)
4. **Expected: ~12.4V** (no diode drop — feedback regulates the output directly)
5. If voltage is correct, connect to FLARM and test firmware update

## Troubleshooting

| Symptom | Check |
|---------|-------|
| 0V on V12_OUT | D1 bridged pads? L1 connected to VUSB? |
| ~5V on V12_OUT | D1 reversed (anode/cathode swapped) |
| ~5V and getting hot | Solder bridge on MT3608 pins |
| Unstable / oscillating | Cold solder joint on L1 or D1 wires |
| USB port shuts down | Short between VUSB and GND — check all joints |
