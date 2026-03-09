# Design Review & Improvement Guide
## FLARM USB Updater — PCB v63 / Schematic Review

Based on full analysis of `pcb_decoded.json` and `schematic_decoded.json`.

---

## 1. Architecture Summary

```
USB-C ─── USBLC6 (ESD) ─── FT232RL (USB→UART) ─── MAX3232 (UART→RS232) ─── RJ45
  │         D2                    U1                     U2                    J1
  │
  ├── 5V ── MT3608 (Boost) ── B5819W (D1) ── ~12V ── RJ45 pins 1,2
  │            U3
  └── 5V ── AMS1117-3.3 (LDO) ── V3V3 ── R7 (10Ω) ── RJ45 pin 3
               U4
```

**Purpose:** USB-C powered FLARM firmware updater. No external 12V supply needed.

---

## 2. Verified Correct — No Action Needed

These items were audited against the decoded JSON and are confirmed working:

### FT232RL (U1) Pin Connections — All Critical Pins Correct

| Pin | Function | Net on PCB | Status |
|-----|----------|------------|--------|
| 26 | TEST | GND | CORRECT — chip won't function if floating |
| 11 | CTS# | GND | CORRECT — prevents COM port hang |
| 9 | DSR# | GND | CORRECT |
| 10 | DCD# | GND | CORRECT |
| 6 | RI# | GND | CORRECT |
| 25 | AGND | GND | CORRECT |
| 4 | VCCIO | VUSB | CORRECT — sets I/O to 5V |
| 20 | VCC | VUSB | CORRECT |
| 15 | USBDP | UD+ | CORRECT |
| 16 | USBDM | UD- | CORRECT |
| 17 | 3V3OUT | C12 decoupling only | CORRECT — no net label, local connection to C12 |
| 22 | CBUS1 | RXLED | CORRECT |
| 23 | CBUS0 | TXLED | CORRECT |
| 1 | TXD | UART_TX | CORRECT |
| 5 | RXD | UART_RX | CORRECT |
| 19 | RESET# | NC | CORRECT — has internal pull-up |
| 27,28 | OSCI/OSCO | NC | CORRECT — FT232RL uses internal oscillator |

All 10 unconnected pins (2, 3, 8, 12, 13, 14, 19, 24, 27, 28) have matching NO_CONNECT flags in the schematic.

### USB-C Connector (USBC1) — Correct

| Pin | Net | Notes |
|-----|-----|-------|
| A6, B6 | UD+ | Both orientations tied together |
| A7, B7 | UD- | Both orientations tied together |
| A4B9, B4A9 | VUSB | Power from both orientations |
| A1B12, B1A12, 1-4 | GND | All ground/shield pins grounded |
| A5 | $1N3909 (CC1) | CC1 via R4 (5.1K) to GND |
| B5 | $1N3913 (CC2) | CC2 via R5 (5.1K) to GND |
| A8, B8 | NC | SBU pins — correctly unconnected |

### Boost Converter Feedback Divider — Correct

```
Vout = Vref × (1 + R1/R2)
     = 0.6V × (1 + 100K/5.1K)
     = 0.6V × 20.6
     = 12.36V (before D1 drop)
     ≈ 12.0V at RJ45 (after ~0.36V Schottky drop)
```

Confirmed: R1 = 100K (0402WGF**1003**TCE), R2 = 5.1K (0402WGF**5101**TCE). Output is correct for FLARM's 8–36V input range.

### MAX3232 (U2) — Correct

- VCC bypass (C5 = 100nF) present
- Charge pump caps C6–C9 (all 100nF) correctly connected
- Only channel 1 used (T1IN/T1OUT, R1IN/R1OUT)
- Channel 2 unused (no MCU on board to drive it) — all channel 2 pins marked NO_CONNECT
- Pin 27, 31 (unused inputs) and pin 35 (unused output) flagged NC

### ESD Protection (D2, USBLC6-2SC6) — Correct

Placed between USB-C connector and FT232RL on both D+/D- lines. Pin 5 (VBUS) connected to VUSB, pin 2 (GND) connected to GND.

### LED Circuit — Correct

All three LEDs driven through 1K resistors from VUSB:
- LED1 (Green) → R6 (1K) → GND: Power indicator, always on
- LED2 (Green) → R8 (1K) → TXLED: TX activity (active-low from FT232RL CBUS0)
- LED3 (Yellow) → R9 (1K) → RXLED: RX activity (active-low from FT232RL CBUS1)

Current: (5V - 2V) / 1K = 3mA per LED. Well within FT232RL's 6mA sink limit.

### Reverse Protection on V12_OUT — Correct

D1 (B5819W Schottky) in the boost converter output path inherently blocks reverse voltage from the RJ45 side. If external 12V is applied to RJ45 pins 1/2 while USB is disconnected, D1 is reverse-biased and blocks current from reaching the boost converter or USB input. **No additional reverse protection needed on V12_OUT.**

### R7 (10 Ohm) on V3V3 to RJ45 Pin 3 — Correct

R7 serves as a **balancing resistor** between the AMS1117-3.3 LDO output and the FLARM's own 3.3V rail. When both are powered:
- R7 prevents large current flow between the two 3.3V regulators
- Limits inrush current into capacitive loads on the cable
- Voltage drop at 25mA display load: 10Ω × 25mA = 0.25V (negligible)

During FLARM firmware updates, FLARM drives pin 3 itself; R7 safely limits any mismatch current. During display firmware updates, AMS1117-3.3 (800mA capable) powers the display through R7.

### PCB Design Rules — Correct

| Net Class | Width Rule | Applied To |
|-----------|-----------|------------|
| Power | 20mil | VUSB, VBOOST, $1N2860 (SW node) |
| Power_12V | 15mil | V12_OUT |
| Default | 10mil | All signal traces |
| Differential | DP1 | UD+/UD- paired |

V12_OUT at 15mil is confirmed in both the net class rule and the per-net rule selector.

---

## 3. USB D+/D- Differential Pair — Detailed Analysis

### Path Length Measurement (from PCB trace coordinates, units: mils)

**UD+ routing:**
- 25 trace segments across top and bottom layers
- 3 vias (e20753, e20754, e20755)
- Top layer: 40.7% of path
- Bottom layer: 59.3% of path
- **Total path length: 883 mils (22.4mm)**

**UD- routing:**
- 23 trace segments across top and bottom layers
- 4 vias (e20756, e20757, e20758, e20759)
- Top layer: 56.5% of path
- Bottom layer: 43.5% of path
- **Total path length: 883 mils (22.4mm)**

### Length Mismatch: 0.045 mils (0.001mm)

This is essentially **zero mismatch**. USB 2.0 Full Speed tolerates up to 80mm mismatch. This design has 0.001mm — 80,000x better than required.

### Via Impact at USB 2.0 Full Speed (12 Mbps)

Each via adds approximately 0.5nH inductance and 0.3pF capacitance. At 12 MHz fundamental frequency:

```
Z_via_inductive = 2π × 12MHz × 0.5nH = 0.038Ω  (vs 45Ω line impedance)
Z_via_capacitive = 1/(2π × 12MHz × 0.3pF) = 44.2kΩ
```

Both are completely negligible. Even at the 5th harmonic (60 MHz), via parasitics remain insignificant. **The 3-4 vias per line are not a signal integrity concern for Full Speed USB.**

### Ground Return Path

The bottom layer has a continuous GND copper pour (POUR1) with extensive GND traces in the USB routing area (x: -800 to -400, y: -200 to +200). Multiple GND vias stitch the top-layer ground to the bottom pour. This provides an excellent return current path beneath the USB differential pair.

### Verdict: USB D+/D- Routing is GOOD

| Metric | Requirement | Actual | Status |
|--------|------------|--------|--------|
| Length matching | < 80mm mismatch | 0.001mm mismatch | EXCELLENT |
| Total path length | < 150mm | 22.4mm | GOOD |
| Via count | Minimize | 3-4 per line | ACCEPTABLE for Full Speed |
| Ground reference | Continuous plane | Solid bottom pour + GND traces | GOOD |
| Separation from boost SW | > 3mm | Boost at (-366,-429), USB at (-460 to -786, 0 to 175) | GOOD |

**No changes needed for USB D+/D-.** The routing is well-matched and the vias are transparent at Full Speed frequencies. If a future revision targets USB High Speed (480 Mbps), the routing would need rework — but the FT232RL only supports Full Speed.

---

## 4. CRITICAL: Power Budget Analysis (FLARM at 300mA)

FLARM draws up to **300mA at 12V** during normal operation (including GPS acquisition). This is the primary design constraint that needs attention.

### Boost Converter Power Chain

```
USB 5V → MT3608 → L1 (22µH) → D1 (B5819W) → 12V @ 300mA
```

| Parameter | Value | Calculation |
|-----------|-------|-------------|
| Output power | 3.6W | 12V × 300mA |
| Boost efficiency (est.) | 82% | MT3608 typical at this ratio |
| Input power | 4.39W | 3.6W / 0.82 |
| Input current (boost) | 878mA | 4.39W / 5V |
| Board overhead | ~30mA | FT232RL (15mA) + MAX3232 (5mA) + LEDs (9mA) |
| **Total USB input current** | **~908mA** | 878mA + 30mA |

### MT3608 IC Stress Analysis

| Parameter | Value | Limit | Margin |
|-----------|-------|-------|--------|
| Duty cycle | 58% | — | — |
| Peak switch current | 0.93A | 2.0A | 53% margin — OK |
| IC power dissipation | ~0.30W | ~0.5W (SOT-23-6 at 125°C Tj) | Marginal |
| Junction temp rise | ~60°C | 150°C max | OK if ambient < 65°C |

**The MT3608 IC itself can handle 300mA output.** Switch current is well under the 2A maximum.

### L1 Inductor Stress — THE BOTTLENECK

| Parameter | Value | L1 Rating | Status |
|-----------|-------|-----------|--------|
| RMS current | 0.88A | **1.0A saturation** | 88% of saturation — MARGINAL |
| Peak current | 0.93A | 1.0A saturation | 93% of saturation — RISKY |
| Ripple current | 0.11A | — | Normal |

**Problem:** The SMNR4020-22UH inductor is rated for 1.0A saturation current. At 300mA FLARM load, the inductor operates at 88–93% of saturation. Above ~85% saturation, inductance starts to roll off, causing:
- Increased ripple current (positive feedback loop)
- Higher peak currents
- Potential audible whine
- Reduced efficiency
- Risk of thermal runaway at sustained load

### USB Power Source Requirement

| Source Type | Current Available | 300mA FLARM Feasible? |
|-------------|------------------|----------------------|
| USB 2.0 Type-A port | 500mA | NO — needs 908mA |
| USB 3.0 Type-A port | 900mA | BARELY — 8mA margin |
| USB-C (default power, Rp=56K) | 500mA | NO |
| USB-C (1.5A source, Rp=22K) | 1.5A | YES — 592mA margin |
| USB-C (3A source, Rp=10K) | 3.0A | YES — 2.1A margin |
| USB-C charger (typical) | 1.5–3.0A | YES |

**Most USB-C chargers and powered hubs advertise 1.5A or 3A** via their Rp pull-up value. The device's 5.1K CC pull-downs will work with any of these. The power budget is fine with a proper USB-C source, but will NOT work reliably from a laptop USB 2.0 Type-A port.

---

## 5. Recommended Fixes — Priority Order

### Fix 1: Upgrade L1 Inductor (HIGH PRIORITY)

**Problem:** L1 (SMNR4020-22UH, 1.0A sat) is too close to saturation at 300mA FLARM load.

**Solution:** Replace with a 22µH inductor rated for ≥ 1.5A saturation in the same 4020 (4mm × 4mm) footprint.

| Option | Part | Isat | DCR | Package | JLCPCB |
|--------|------|------|-----|---------|--------|
| A (recommended) | SWPA4020S220MT | 1.35A | 200mΩ | 4020 | Search TDK |
| B | NR4018T220M | 1.5A | 170mΩ | 4018 (fits 4020 pad) | Search Taiyo Yuden |
| C (best margin) | CDRH4D28-220NC | 1.7A | 150mΩ | 4.7×4.7mm | Needs pad check |

**In EasyEDA:** Open footprint for L1 → verify pad dimensions match the replacement → swap the JLCPCB C-number in the BOM.

If the 4020 footprint is constraining, a 4030 or 5020 inductor with 2A+ rating gives full margin. This requires a footprint change but is a one-pad-edit.

### Fix 2: Update README Power Notes (MEDIUM PRIORITY)

The README currently states:
```
Typical USB draw: ~210 mA (USB 2.0 / 500 mA limit OK)
Peak USB draw: ~380 mA (FLARM GPS acquisition)
```

This should be updated to reflect the 300mA FLARM max:
```
Typical USB draw: ~400–600mA (FLARM idle + boost + board)
Peak USB draw: ~910mA (FLARM at 300mA + boost overhead)
REQUIRED: USB-C charger or powered hub (1.5A minimum). Laptop USB-A ports (500mA) are NOT sufficient.
```

### Fix 3: Consider MT3608 → SDB628 Swap (OPTIONAL)

The SDB628 is a **pin-compatible** drop-in replacement for the MT3608 in SOT-23-6:
- Same pinout (SW, GND, FB, EN, IN, NC)
- Lower Rdson (~150mΩ vs ~300mΩ) → less heat
- Better efficiency at higher currents
- Same 1.2MHz switching frequency

This is a BOM-only change — no PCB modification needed. Search JLCPCB for "SDB628" and swap the C-number. The feedback divider (R1/R2) and all external components remain identical.

If SDB628 is unavailable on JLCPCB, the MT3608 works — just ensure L1 is upgraded.

### Fix 4: Add USB Power Warning to Silkscreen (LOW PRIORITY)

Add a text note on the top silkscreen layer: `USB-C 1.5A+ REQUIRED` near the USB-C connector. This prevents users from plugging into a 500mA USB 2.0 port and wondering why the FLARM doesn't power up.

**In EasyEDA:** Place → Text → Layer: Top Silkscreen → size 30mil → position near J1.

---

## 6. Cosmetic / Documentation Improvements

### Net Name Cleanup

15 auto-generated net names should be renamed for readability. This doesn't affect board function but makes debugging and documentation much easier.

| Current Name | Suggested Name | Connection |
|-------------|---------------|------------|
| $1N2847 | BOOST_ENABLE | R3 → U3 EN pin |
| $1N2860 | SW_NODE | L1 pin 1 → U3 SW pin |
| $1N2875 | BOOST_FB | R1/R2 junction → U3 FB pin |
| $1N3104 | CP_C1P | MAX3232 C1+ → C6 |
| $1N3108 | CP_C1N | MAX3232 C1- → C6 |
| $1N3114 | CP_C2P | MAX3232 C2+ → C7 |
| $1N3119 | CP_C2N | MAX3232 C2- → C7 |
| $1N3125 | CP_VP | MAX3232 V+ → C8 |
| $1N3129 | CP_VN | MAX3232 V- → C9 |
| $1N3570 | 3V3_FLARM | R7 → RJ45 pin 3 |
| $1N3909 | CC1 | R4 → USB-C CC1 (pin A5) |
| $1N3913 | CC2 | R5 → USB-C CC2 (pin B5) |
| $1N4089 | LED1_A | R6 → LED1 anode |
| $1N4091 | LED2_A | R8 → LED2 cathode (TXLED) |
| $1N4093 | LED3_A | R9 → LED3 cathode (RXLED) |

**In EasyEDA:** Click a wire segment on the net → Properties → change Net Name. All connected wires and pins update automatically.

### Schematic Annotations

Add text notes on the schematic near key blocks:
- Near boost converter: `Vout = 12.36V → 12.0V after D1`
- Near R1/R2: `FB divider: 100K / 5.1K`
- Near R7: `3V3 balancing resistor for FLARM/display power`
- Near CC pull-downs: `5.1K = USB-C default power sink`

---

## 7. NOT Issues — Clarifications on Previous Remarks

These items were flagged in the initial review but are **confirmed not problems** after deeper analysis:

### "No overcurrent protection on USB power"

While a PTC fuse would add protection, it's not required for this design:
- The MT3608 has internal current limiting (2A switch limit)
- The FT232RL has internal overcurrent protection
- Most USB hosts and chargers have their own overcurrent protection
- A PTC fuse adds voltage drop that reduces boost converter headroom
- **Verdict:** Not adding a fuse is an acceptable design choice. If desired for production, a 1.1A PTC (Littelfuse 0805L110WR) could be added in series with VUSB near the USB-C connector.

### "USB D+/D- routing has too many vias"

Corrected above in Section 3. The via count (3–4 per line) is fine for USB 2.0 Full Speed. Path length matching is near-perfect (0.001mm). The ground plane provides excellent return paths. **No routing changes needed.**

### "MAX3232 unused inputs should be tied to GND/VCC"

The MAX3232's unused receiver input (R2IN) is a high-impedance CMOS input. While best practice suggests tying unused inputs, leaving them floating on the MAX3232 causes no functional issue — the charge pump and used channel operate independently. The NO_CONNECT flag is acceptable.

### "Inner layer definitions present but unused"

These are EasyEDA Pro defaults for a 2-layer design. They don't affect Gerber export or manufacturing. Non-issue.

---

## 8. Board Stackup & Manufacturing Notes

From the decoded PCB:

| Layer | Type | Thickness |
|-------|------|-----------|
| Top Silkscreen | Marking | — |
| Top Solder Mask | Mask | 0.394 mil |
| **Top Copper** | **Signal + Components** | **1.379 mil (1oz)** |
| FR4 Dielectric | Substrate | 59.449 mil (1.51mm) |
| **Bottom Copper** | **GND Pour** | **1.378 mil (1oz)** |
| Bottom Solder Mask | Mask | 0.394 mil |
| Bottom Silkscreen | Marking | — |

Total board thickness: ~1.6mm (standard). Compatible with all JLCPCB standard options.

The bottom layer GND pour (POUR1) covers the full board with solid fill. After any trace changes, rebuild it: **Select copper region → right-click → Rebuild Copper Area**.

---

## 9. RJ45 Pinout Verification

| Pin | PCB Net | Signal | Notes |
|-----|---------|--------|-------|
| 1 | V12_OUT | +12V | From boost, through D1 |
| 2 | V12_OUT | +12V | Paralleled with pin 1 for current sharing |
| 3 | $1N3570 | 3.3V | AMS1117-3.3 V3V3 via R7 (10Ω balancing) |
| 4 | GND | Ground | |
| 5 | RS232_RX | FLARM TX → this board RX | MAX3232 R1IN |
| 6 | RS232_TX | This board TX → FLARM RX | MAX3232 T1OUT |
| 7 | GND | Ground | |
| 8 | GND | Ground | |
| 9 | GND | Shield | |
| 10 | GND | Shield | |

Pins 1+2 paralleled for 12V: effective current path of ~600mA (2× the max 300mA FLARM draw). This is good practice for reducing connector pin resistance.

---

## 10. Action Checklist

### Before Next Board Order

- [ ] **Upgrade L1** to ≥ 1.5A saturation current inductor in 4020 footprint
- [ ] **Update README** power notes to reflect 300mA FLARM / 910mA USB draw
- [ ] **Add silkscreen note** "USB-C 1.5A+" near connector
- [ ] **Rename auto-generated nets** in EasyEDA schematic (see Section 6 table)
- [ ] **Rebuild copper pour** after any trace/component changes
- [ ] **Run DRC** — verify zero violations

### Optional Enhancements

- [ ] Evaluate SDB628 as MT3608 drop-in replacement (lower Rdson, better efficiency)
- [ ] Add schematic annotation text for key values (Vout, FB divider, R7 purpose)
- [ ] Consider 1.1A PTC fuse on VUSB for production builds

### Testing Protocol (Current Board)

If testing the existing board as-is with the current L1 (1.0A rated):
1. Connect to a USB-C charger rated ≥ 1.5A
2. Connect FLARM via RJ45
3. Monitor MT3608 and L1 temperature with thermal camera or finger test
4. If L1 gets hot to touch (>60°C surface) during sustained FLARM operation, L1 upgrade is mandatory
5. Monitor USB voltage at the connector — if it sags below 4.5V, the USB source is insufficient
6. Verify 12V output remains stable (11.5–12.5V) under FLARM load

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-27 | Initial design review based on pcb_decoded.json and schematic_decoded.json |
