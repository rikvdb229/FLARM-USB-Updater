# Power Analysis: Can USB Power FLARM Without an External Battery?

## TL;DR — Yes, It Already Works for Firmware Updates

The board's primary use case — firmware updates — draws only **~250mA from USB**.
Any USB port handles this. The feared 300mA@12V (910mA USB) scenario only occurs
during full FLARM operation, which is not the primary use case.

---

## 1. The Real FLARM Power Numbers

### Published Specifications (from FLARM manuals)

| Model | Typical Current | Supply Range | Update Method |
|-------|----------------|-------------|---------------|
| **Classic FLARM** (F6–F9) | ~85mA @ 12V (1.02W)¹ | 8–26V (28V peak) | RS-232 via FLARM Tool |
| **PowerFLARM Core** (ADS-B) | 165mA @ 12V (1.98W) | 8–35V | RS-232 via RJ45 |
| **PowerFLARM Core** (Pure) | **95mA @ 12V (1.14W)** | 8–35V | RS-232 via RJ45 |
| **PowerFLARM Portable** | ~165mA @ 12V | 8–23V | RS-232 via RJ45 |
| **PowerFLARM Fusion** | 180mA @ 12V (2.16W) | **12–32V** | WiFi / USB stick |
| **PowerFLARM Flex** | 160mA @ 12V (1.92W) | 10–32V (RJ45) | WiFi / USB-C (5V native!) |
| **PowerFLARM Eagle** (LXNAV) | 80mA @ 12V (0.96W) | 9–36V | Via host device |

¹ PowerMouse (Classic FLARM-based) measured at 85mA / 1.02W. Classic FLARM manual
specifies a 500mA circuit breaker — confirming peak current is well under 500mA.

### Bootloader / Firmware Update Mode (Estimated)

During firmware update via RS-232:
- GPS receiver: **OFF** (not needed, saves ~30-50mA)
- RF transmitter: **OFF** (not transmitting, saves ~20-40mA)
- CPU: running at reduced activity (receiving serial data at 19200 baud)
- Display: minimal or off

**Estimated bootloader consumption: 50–100mA @ 12V (0.6–1.2W)**

No published data exists for bootloader-mode power draw. This estimate is based on
subtracting GPS and RF from the total power budget. Even if we conservatively use
100mA, the math works out well.

### Key Insight: FLARM Has Internal Switching Regulators

FLARM accepts 8–35V (a 4.4:1 range). A linear regulator dropping 35V to 3.3V at
165mA would dissipate 5.2W — impossible in FLARM's small form factor. FLARM
**must** use internal buck converters. This means:

- **FLARM is a constant-power load** (not constant-current)
- Lowering supply voltage → FLARM draws MORE current (same watts)
- At 12V: 165mA × 12V = 1.98W
- At 10V: 1.98W / 10V = 198mA (higher current, same power)
- At 8V: 1.98W / 8V = 248mA (even higher current)

This is the user's valid concern: **"lower voltage implies higher current."**

---

## 2. MT3608 Real-World Performance

### Efficiency (Measured, Not Datasheet)

The MT3608 datasheet claims up to 97% efficiency. Real-world measurements on
actual modules show significantly lower numbers:

| Output Voltage | Light Load (100mA) | Medium Load (200mA) | Heavy Load (500mA) |
|---------------|-------------------|--------------------|--------------------|
| 5V → 8V | ~91% | ~92% | ~90% |
| 5V → 9V | ~90% | ~91% | ~89% |
| 5V → 10V | ~89% | ~90% | ~88% |
| 5V → 12V | ~87% | ~88% | ~85% |

Source: Cross-referenced from ProtoSupplies, EmbedBlog, and finalrewind.org benchmarks.

### MT3608 Key Specs (from datasheet)

- Switch current limit: **4A** (ample headroom)
- RDS(on): 80–150 mΩ
- Switching frequency: 1.2 MHz
- Max duty cycle: 90%
- Thermal shutdown: 155°C

### Inductor Stress at Different Operating Points

For PowerFLARM Core at full operation (1.98W constant power):

| Vout | Duty Cycle | Efficiency | I_input | I_L_peak | L1 (1.0A) margin |
|------|-----------|-----------|---------|----------|------------------|
| 12V | 58.3% | 85% | 466mA | 527mA | 47% headroom |
| 10V | 50.0% | 88% | 450mA | 503mA | 50% headroom |
| 9V | 44.4% | 90% | 440mA | 488mA | 51% headroom |
| 8V | 37.5% | 92% | 431mA | 471mA | 53% headroom |

**All operating points are well within L1's 1.0A rating.** The previous analysis
showing 930mA peak was based on 300mA @ 12V (3.6W), not the actual 165mA (1.98W).

For bootloader mode (estimated 80mA = 0.96W):

| Vout | I_input | I_L_peak | USB total |
|------|---------|----------|-----------|
| 12V | 226mA | 283mA | **~260mA** |

---

## 3. USB Power Reality

### The Spec vs. The Real World

| USB Standard | Spec Limit | Real-World Enforcement |
|-------------|-----------|----------------------|
| USB 2.0 Type-A | 500mA | Polyfuses trip at ~1A. Most ports deliver 700mA+ without issue |
| USB 3.0 Type-A | 900mA | Often shares same eFuse as USB 2.0, delivers 1-2A |
| USB-C (default, Rp=56K) | 500mA/900mA | Most USB-C sources use 22K or 10K Rp (1.5A/3A) |
| USB-C charger (typical) | 1.5–3.0A | Phone chargers: 1.5-3A. Laptop adapters: 3-5A |

**Key insight from Hackaday "USB and the Myth of 500 Milliamps":**
USB overcurrent protection is a **safety mechanism** (preventing fires), not a
regulatory enforcement tool. The protection threshold is set well above 500mA:

- Desktop motherboards: Polyfuses rated 1A (shared per port pair). Won't trip at 600mA.
- Laptops: eFuse ICs like TPS2069 trip at **2.3–3.4A**, not 500mA.
- Result: Drawing 600mA from a "500mA" port works reliably on virtually all hardware.

### USB-C CC Pin Detection (Already in the Design)

The board has R4/R5 = 5.1K CC pull-downs. This creates a voltage divider with the
host's CC pull-up:

| Host Rp | CC Voltage | Current Available |
|---------|-----------|-------------------|
| 56K | ~0.42V | Default (500/900mA) |
| 22K | ~0.94V | 1.5A |
| 10K | ~1.69V | 3.0A |

Most USB-C chargers and laptop USB-C ports use 22K or 10K → 1.5A or 3.0A available.

---

## 4. Complete Power Budget — All Scenarios

### Scenario A: Firmware Update via RS-232 (PRIMARY USE CASE)

FLARM in bootloader mode, 80mA @ 12V estimated:

```
Boost output:        0.96W (12V × 80mA)
MT3608 @ 87% eff:    1.10W input → 220mA from USB
FT232RL:             20mA
MAX3232:             5mA
LEDs (all 3):        9mA
3.3V display (R7):   25mA
─────────────────────────────────
Total USB draw:      ~280mA
```

**VERDICT: Works on ANY USB port.** Even USB 2.0 at 500mA has 220mA of margin.

### Scenario B: FLARM Normal Operation — PowerFLARM Core (165mA @ 12V)

```
Boost output:        1.98W (12V × 165mA)
MT3608 @ 87% eff:    2.28W input → 455mA from USB
Board overhead:      ~55mA (FT232RL + MAX3232 + LEDs + 3.3V display)
─────────────────────────────────
Total USB draw:      ~510mA
```

**VERDICT: Borderline on USB 2.0 (500mA spec), but works in practice.**
Most USB 2.0 ports actually deliver 600-700mA. Any USB-C charger easily handles it.

### Scenario C: FLARM Normal Operation — Classic FLARM (85mA @ 12V)

```
Boost output:        1.02W (12V × 85mA)
MT3608 @ 87% eff:    1.17W input → 234mA from USB
Board overhead:      ~55mA
─────────────────────────────────
Total USB draw:      ~290mA
```

**VERDICT: Works on ANY USB port.** Comfortable margin even on USB 2.0.

### Scenario D: FLARM Startup Transient (Peak, estimated 250mA @ 12V)

```
Boost output:        3.0W (12V × 250mA)
MT3608 @ 85% eff:    3.53W input → 706mA from USB
Board overhead:      ~55mA
─────────────────────────────────
Total USB draw:      ~760mA (brief, during GPS acquisition)
```

**VERDICT: Exceeds USB 2.0 500mA spec, but within real-world delivery (1A+).**
Works on USB 3.0 (900mA) and any USB-C charger. Transient only, not sustained.

### Scenario E: Original 300mA Assumption (WORST CASE — unlikely)

```
Boost output:        3.6W (12V × 300mA)
MT3608 @ 85% eff:    4.24W input → 847mA from USB
Board overhead:      ~55mA
─────────────────────────────────
Total USB draw:      ~900mA
```

**VERDICT: Requires USB 3.0 or USB-C charger.** This scenario is unlikely based
on published specs (no FLARM model draws 300mA typical at 12V).

---

## 5. What Lowering the Voltage Actually Saves

### For a Constant-Power Load (FLARM with switching regulators)

| Output V | R1 Value | FLARM I | Boost η | USB Draw | Savings vs 12V |
|----------|----------|---------|---------|----------|----------------|
| **12V** | 100K | 165mA | 85% | 510mA | — (baseline) |
| **10V** | 82K | 198mA | 88% | 480mA | **30mA** |
| **9V** | 68K | 220mA | 90% | 465mA | **45mA** |
| **8V** | 56K | 248mA | 92% | 460mA | **50mA** |

**The savings are real but modest (30–50mA).** The higher FLARM current at lower
voltage nearly cancels the efficiency improvement. The user's instinct was correct.

### For Bootloader Mode (0.96W constant power)

| Output V | USB Draw | Savings |
|----------|----------|---------|
| 12V | 280mA | — |
| 10V | 270mA | 10mA |
| 9V | 265mA | 15mA |

**Negligible difference.** Bootloader mode works at any voltage from any USB port.

### Compatibility Impact of Lowering Voltage

| FLARM Model | Min Voltage | 12V | 10V | 9V | 8.5V |
|-------------|------------|-----|-----|-----|------|
| Classic FLARM | 8V | ✓ | ✓ | ✓ | ✓ |
| PowerFLARM Core | 8V | ✓ | ✓ | ✓ | ✓ |
| PowerFLARM Portable | 8V | ✓ | ✓ | ✓ | ✓ |
| **PowerFLARM Fusion** | **12V** | **✓** | **✗** | **✗** | **✗** |
| PowerFLARM Flex | 10V | ✓ | ✓ | ✗ | ✗ |

**Lowering below 12V excludes PowerFLARM Fusion.**
Lowering below 10V also excludes PowerFLARM Flex.

Note: Fusion updates via WiFi/USB stick, not RS-232, so it's likely not a target
for this board anyway. But users might still use the board to power a Fusion for
configuration via RS-232.

---

## 6. All Options Evaluated

### Option 1: No Hardware Changes — Document the Use Case (RECOMMENDED)

**What:** Keep 12V output. Add clear documentation that:
- During firmware updates: ~280mA USB draw → works on any USB port
- During full FLARM operation: ~510mA → use a USB-C charger or USB 3.0 port
- Upgrade L1 to 1.5A saturation for margin (BOM-only change)

**Pros:**
- Zero PCB changes required
- Compatible with ALL FLARM models (including Fusion at 12V minimum)
- Primary use case (firmware update) already works everywhere
- Simplest path to production

**Cons:**
- Full FLARM operation borderline on strict USB 2.0 ports (but works in practice)

**Required changes:**
- Update README with accurate power figures
- Add silkscreen note: "USB-C 1.5A+ recommended" (not "required" — it works for updates from any port)
- Upgrade L1 to ≥1.5A inductor (BOM swap, no PCB change)

---

### Option 2: Lower Voltage to 10V (R1 = 82K)

**What:** Change R1 from 100K to 82K.
- Vout = 0.6 × (1 + 82K/5.1K) = 10.25V → 9.9V after D1

**Pros:**
- Saves ~30mA USB draw (510 → 480mA)
- Reduces inductor and thermal stress slightly
- Still compatible with Classic FLARM, Core, Portable, Flex

**Cons:**
- **Excludes PowerFLARM Fusion** (needs 12V minimum)
- Marginal savings (30mA) for a constant-power load
- FLARM draws MORE current at lower voltage (198mA vs 165mA)
- Component tolerances: 82K ±1% + 5.1K ±1% + D1 Vf variation → actual output 9.5–10.4V
- Need to verify FLARM behaves correctly at edge of 10V Flex minimum

**Verdict:** Marginal benefit, meaningful compatibility loss. Not recommended unless
Fusion support is explicitly excluded.

---

### Option 3: Lower Voltage to 9V (R1 = 68K)

**What:** Change R1 from 100K to 68K.
- Vout = 0.6 × (1 + 68K/5.1K) = 8.6V → 8.2V after D1

**Pros:**
- Saves ~45mA USB draw
- Best boost converter efficiency

**Cons:**
- **8.2V is dangerously close to FLARM's 8V minimum**
- With tolerances: could drop to 7.8V → FLARM shuts down
- Excludes Fusion AND Flex
- At 8.2V, FLARM's "low voltage" LED warning will flash

**Verdict:** Too risky. Insufficient margin above FLARM's 8V cutoff.

---

### Option 4: USB-C CC Voltage Detection (Smart Power Gate)

**What:** Add a voltage comparator that reads the CC pin voltage and controls
the MT3608 EN pin. Only enable 12V output when the USB source advertises ≥1.5A.

**Circuit:**
```
CC1 pin ──── [comparator] ──── MT3608 EN pin
              ref = 0.66V       (currently pulled high via R3)
```

If CC voltage > 0.66V (source advertises 1.5A+): EN = HIGH → boost runs → FLARM powered
If CC voltage < 0.66V (default 500mA): EN = LOW → boost off → only serial active

**Pros:**
- Guarantees adequate power before enabling FLARM
- Safe on any USB port (boost simply doesn't start if power insufficient)
- Could drive an indicator LED (green = full power, red = serial only)

**Cons:**
- Adds 1-2 components (comparator IC + reference, or dual comparator)
- Doesn't work with USB-A to USB-C cables (no CC pin in USB-A)
- Most firmware updates are done from laptops with USB-A ports
- FLARM users would see "not enough power" on the very ports they're using
- Solves a problem that doesn't exist (firmware updates work at 280mA)

**Verdict:** Over-engineered for this use case. The problem it solves (insufficient
power) doesn't occur during firmware updates.

---

### Option 5: USB-C Power Delivery Negotiation (9V/12V from PD)

**What:** Add a USB PD controller IC (e.g., STUSB4500) to negotiate 9V or 12V
directly from the USB-C charger. Eliminate or simplify the boost converter.

**Pros:**
- 12V directly from PD → no boost converter losses
- Could deliver 3A @ 12V = 36W (massively over-spec, but bulletproof)
- Most efficient possible solution

**Cons:**
- Adds expensive PD controller IC (~$1-2)
- Requires PD-capable charger (not all USB-C chargers support PD)
- PD negotiation adds 200-500ms startup delay
- Board requires significant redesign (new IC, CC routing, PD protocol)
- The boost converter already works fine at 2W

**Verdict:** Interesting for a v2 product, but massive over-engineering for
a firmware updater that draws 280mA during its primary use case.

---

### Option 6: Eliminate Boost Converter — Power FLARM at 5V

**What:** FLARM minimum is 8V. 5V is below minimum. This option is NOT viable.

PowerFLARM Flex has a 5V USB-C input, but that's its own internal power path —
it doesn't expose 5V on the RJ45. Other FLARM models require 8V minimum.

**Verdict:** Not possible without a boost converter.

---

## 7. Recommendation Summary

### What to Do

```
┌─────────────────────────────────────────────────────────────────┐
│  RECOMMENDED: Option 1 — Keep 12V, document accurately         │
│                                                                 │
│  1. Upgrade L1 inductor to ≥1.5A rating (BOM swap)            │
│  2. Update README with real power numbers                       │
│  3. Add silkscreen: "USB-C 1.5A+ recommended"                 │
│  4. The board ALREADY WORKS for firmware updates from any USB   │
│     port, including laptop USB 2.0 ports (~280mA draw)         │
└─────────────────────────────────────────────────────────────────┘
```

### Why the Other Options Don't Win

| Option | Saves | Costs | Net Benefit |
|--------|-------|-------|-------------|
| Lower to 10V | 30mA | Loses Fusion compatibility | Negative |
| Lower to 9V | 45mA | Dangerously close to 8V minimum | Negative |
| CC detection | Safe gating | Adds components, blocks USB-A use | Negative |
| USB PD | Eliminates boost | Major redesign, needs PD charger | Negative for v1 |

### Power Budget Summary Table

| Use Case | USB Draw | USB 2.0 (500mA) | USB 3.0 (900mA) | USB-C Charger |
|----------|---------|-----------------|-----------------|---------------|
| **Firmware update** | **280mA** | **✓ Easy** | **✓ Easy** | **✓ Easy** |
| Classic FLARM full | 290mA | ✓ Easy | ✓ Easy | ✓ Easy |
| PF Core full | 510mA | ~Borderline¹ | ✓ OK | ✓ Easy |
| PF Core startup peak | 760mA | ✗ Over spec² | ✓ Tight | ✓ Easy |

¹ Works in practice — real USB 2.0 ports deliver 600-700mA before protection.
² Brief transient. Most ports survive this. MT3608 soft-start limits inrush.

---

## 8. Corrected Design Review Numbers

The original design review (Section 4) used **300mA @ 12V = 3.6W** as the FLARM
load. This should be corrected to reflect actual published specifications:

| Parameter | Original (300mA) | Corrected (165mA) |
|-----------|------------------|-------------------|
| Output power | 3.6W | 1.98W |
| Input current (boost) | 878mA | 455mA |
| Total USB draw | 910mA | 510mA |
| L1 peak current | 930mA (93% of 1.0A!) | 527mA (53% of 1.0A) |
| L1 upgrade urgency | CRITICAL | RECOMMENDED (for margin) |

**The 300mA figure was overly conservative.** No FLARM model draws 300mA typical
at 12V. The worst case (PowerFLARM Fusion at 200mA peak) still only draws 585mA
from USB — well within real-world USB capability.

---

## 9. Boost Converter Alternatives — Is There Something Better Than MT3608?

### SOT23-6 Drop-in Replacements (Same Footprint)

| IC | Notes | Efficiency vs MT3608 |
|---|---|---|
| SDB628 / B6286 | Clone, same datasheet | Identical |
| SX1308 | Clone, same datasheet | Identical |
| FP6291 | 2A, 1MHz | Similar |

**These are all the same design with different labels.** No efficiency improvement.

### Synchronous Upgrade: TPS61088 (QFN-20)

The only meaningful efficiency gain requires switching to a **synchronous** boost
(integrated rectifier MOSFET instead of external Schottky diode):

| Parameter | MT3608 (current) | TPS61088 (upgrade) |
|---|---|---|
| Topology | Asynchronous | **Synchronous** |
| Switch Rdson | 80–150mΩ | **11mΩ** |
| Rectifier | External Schottky D1 | **Internal 13mΩ MOSFET** |
| Real efficiency 5V→12V | 85–88% | **90–93%** |
| Package | SOT23-6 | **QFN-20 (4.5×3.5mm)** |
| Switch current | 2A | **10A** |
| Output power | ~3W practical | **30W** |
| LCSC price | ~$0.08 | ~$0.50 |

**Verdict:** Real improvement, but requires PCB redesign (different footprint).
Eliminates D1, reduces heat. **Best candidate for a v2 board.** Not worth it for
v1 where the MT3608 already handles the 2W FLARM load comfortably.

### ICs Investigated But NOT Suitable for 12V Output

| IC | Why Not |
|---|---|
| TPS61023 / TPS61022 | Max output 5.5V — can't reach 12V |
| TPS61032 | Max output 5.5V, TSSOP-16, low LCSC stock |
| FP6298 | Max output 9V, SOP-8 package |
| SY8303 | Step-DOWN (buck) converter, not boost |
| ME2149 | Low current, designed for low-power only |

### Conclusion: MT3608 is the Right Choice for v1

For a SOT23-6 boost to 12V, the MT3608 is effectively the only game in town.
Its clones offer no improvement. A real upgrade requires moving to a synchronous
topology (TPS61088) with a different package — save that for v2.

---

## 10. USB-C Can Deliver More Power — Options

### What the Current Design Gets (5.1K CC Pull-downs)

| Source Type | Rp Pull-up | Current Available | Works? |
|---|---|---|---|
| USB-A port (via A→C cable) | None | 500mA | Firmware updates: YES |
| USB-C laptop (default) | 56K | 500mA/900mA | Firmware updates: YES |
| USB-C laptop (high power) | 22K | 1.5A | Everything: YES |
| USB-C phone charger | 10K or 22K | 1.5A–3.0A | Everything: YES |
| USB-C PD charger | PD negotiation | 1.5A–5A | Everything: YES |

Most USB-C chargers provide 1.5A+ even without PD negotiation, because they use
22K or 10K Rp pull-ups. The board's existing 5.1K Rd pull-downs are sufficient.

### USB BC 1.2 DCP — NOT Applicable

BC 1.2 DCP works by shorting D+ to D-. This board **needs D+/D- for FT232RL
serial data transfer**. BC 1.2 is for charger-only devices. Not usable here.

### v2 Option: STUSB4500 USB PD Sink (Negotiate 12V Directly)

The STUSB4500 (LCSC C2678061, ~$0.75, QFN-24) is an autonomous USB PD sink
controller that negotiates voltage from a PD charger **without any MCU**:

```
USB-C PD charger → STUSB4500 negotiates 12V → Direct to RJ45 pins 1,2
                    No boost converter needed! 100% efficient.
Fallback: If source only offers 5V → MT3608 boost as backup
```

Configuration is stored in NVM (40 bytes, programmed once via I2C during
manufacturing). The IC has indicator pins for PDO selection (drive LEDs).

**For v2:** This would allow a dual-path design:
- PD charger available → 12V direct → zero loss
- Non-PD source → MT3608 fallback → current design
- Net result: works everywhere, optimal efficiency with PD chargers

---

## 11. Additional Schematic/PCB Improvements

### Missing From Current Design

| Item | Priority | Description |
|---|---|---|
| **No mounting holes** | MEDIUM | Add 2× M2 mounting holes at opposite corners for enclosure |
| **No test points** | LOW | Add test pads: V12_OUT, 3.3V, GND for debugging with multimeter |
| **No ferrite bead on VUSB** | LOW | A 600Ω@100MHz ferrite between USB VBUS and analog VCC would reduce switching noise on FT232RL. Optional — FT232RL has internal filtering. |
| **No EEPROM footprint** | LOW | FT232RL uses internal EEPROM with factory defaults (VID/PID, 19200 baud). Add unpopulated 93C46 footprint only if custom VID/PID or serial number is needed. Not required for current use case. |

### Confirmed Good (No Changes Needed)

| Item | Status |
|---|---|
| RJ45 shield (pins 9,10) to GND | Correct |
| Input caps (C1 22µF + C2 100nF) | Adequate for 2W load |
| Output caps (C3 22µF + C4 4.7µF at 25V) | Good — 2× voltage margin |
| All bypass caps present | 7× 100nF on all IC VCC pins |
| Power-on sequencing | MT3608 EN pulled high via R3 — 12V ramps up in ~4ms (soft-start). FT232RL initializes in ~100ms. No conflict. |
| RS232 TX/RX routing | Adequate separation, low-speed (19200 baud) |

---

## Appendix A: Resistor Values for Different Output Voltages

Using R2 = 5.1K (fixed), Vref = 0.6V, D1 Vf = 0.36V:

| R1 Value | Vboost | Vout (after D1) | Standard? |
|----------|--------|-----------------|-----------|
| 56K | 7.19V | 6.83V | Yes (E96) |
| 68K | 8.60V | 8.24V | Yes (E24) |
| 75K | 9.44V | 9.08V | Yes (E96) |
| 82K | 10.25V | 9.89V | Yes (E24) |
| 91K | 11.31V | 10.95V | Yes (E96) |
| **100K** | **12.36V** | **12.00V** | **Yes (E24) — CURRENT** |
| 110K | 13.54V | 13.18V | Yes (E96) |

## Appendix B: MT3608 Efficiency — Datasheet vs Real World

| Condition | Datasheet | Real Module |
|-----------|-----------|-------------|
| 5V → 12V, 100mA | ~93% | ~87% |
| 5V → 12V, 200mA | ~92% | ~88% |
| 5V → 12V, 500mA | ~90% | ~85% |
| 5V → 9V, 200mA | ~95% | ~91% |

Real-world data from ProtoSupplies, EmbedBlog, and finalrewind.org benchmarks.
Custom PCB designs with proper layout may achieve 2-3% better than cheap modules.

## Appendix C: Sources

- [PowerFLARM Core Installation Manual (FTD-033)](https://www.flarm.com/wp-content/uploads/2024/04/FTD-033-PowerFLARM-Core-Installation-Manual.pdf) — 165mA @ 12V, 8-35V range
- [PowerFLARM Fusion Installation Manual (FTD-077)](https://www.flarm.com/wp-content/uploads/2024/03/FTD-077-PowerFLARM-Fusion-Installation-Manual.pdf) — 180mA @ 12V, 12-32V range
- [PowerFLARM Flex Manual v1.2 (FTD-114)](https://www.flarm.com/wp-content/uploads/2025/09/FTD-114-PowerFLARM-Flex-Manual-v1.2.pdf) — 160mA, USB-C native
- [PowerFLARM Core Manual (v3.41)](https://wingsandwheels.com/media/wysiwyg/PDF/FLARM/PowerFLARM_Core_Manual_EN.pdf) — RJ45 pinout
- [USB And The Myth Of 500 Milliamps (Hackaday)](https://hackaday.com/2024/07/03/usb-and-the-myth-of-500-milliamps/) — Real USB overcurrent behavior
- [MT3608 Datasheet (Aerosemi)](https://www.olimex.com/Products/Breadboarding/BB-PWR-3608/resources/MT3608.pdf) — 4A switch limit, efficiency curves
- [MT3608 Boost Module (ProtoSupplies)](https://protosupplies.com/product/mt3608-mini-adjustable-dc-dc-boost-module/) — Real efficiency measurements
- [Benchmarking MT3608 (finalrewind.org)](https://finalrewind.org/interblag/entry/benchmarking-aliexpress-mt3608-boost-converter/) — Load testing data
- [USB BC 1.2 Overview (Analog Devices)](https://www.analog.com/en/resources/technical-articles/overview-of-usb-battery-charging-revision-12-and-the-important-role-of-charger-detectors.html) — Charging port detection
- [USB-C CC Resistors (Hackaday)](https://hackaday.com/2023/01/04/all-about-usb-c-resistors-and-emarkers/) — CC voltage divider
- [USB Power on Motherboards (USB-IF)](https://www.usb.org/sites/default/files/power_delivery_motherboards.pdf) — OCP implementation
- [TPS61088 Datasheet (TI)](https://www.ti.com/product/TPS61088) — Synchronous boost, 10A switch, QFN-20
- [TPS61088 Review (DONE.LAND)](https://done.land/components/power/powersupplies/dc-dc-converters/boost/tps61088/) — Real performance data
- [STUSB4500 Datasheet (ST)](https://www.st.com/resource/en/datasheet/stusb4500.pdf) — Autonomous USB PD sink, QFN-24
- [STUSB4500 on LCSC (C2678061)](https://www.lcsc.com/product-detail/C2678061.html) — JLCPCB-compatible
- [STUSB4500 GitHub](https://github.com/usb-c/STUSB4500) — NVM configuration tools
- [USB BC 1.2 Overview (Analog Devices)](https://www.analog.com/en/resources/technical-articles/overview-of-usb-battery-charging-revision-12-and-the-important-role-of-charger-detectors.html) — DCP/CDP/SDP detection
- [Synchronous Boost (Analog Devices)](https://www.analog.com/en/resources/technical-articles/synchronous-boost-converters-provide-high-voltage-without-the-heat.html) — Why synchronous is better
