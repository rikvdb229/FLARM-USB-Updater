# USB Data Line Impedance — Plain Language Guide
## FLARM USB Updater — EasyEDA Pro

---

## What Is Impedance and Why Should You Care?

Think of impedance like the "resistance to flow" that a high-speed electrical signal sees as it travels along a PCB trace. It's similar to water pressure in a pipe — if the pipe suddenly changes diameter, water splashes back. Same thing with electrical signals: if the impedance of a trace suddenly changes, the signal "bounces back" (reflects), and that causes data errors.

For USB, the spec says: **the two data lines (D+ and D−) together must have a differential impedance of 90 ohms (±15%)**, meaning anywhere from about 77 to 104 ohms is acceptable. Each individual trace should be about 45 ohms.

---

## Does This Actually Matter for YOUR Board?

**Short answer: not really, and here's why.**

Your board runs **USB 2.0 Full Speed (12 Mbps)** — NOT High Speed (480 Mbps). At Full Speed:

1. **The traces are very short** — your D+/D− path from J1 (USB-C) through D2 (ESD) to U1 (FT232RL) is only about 15–20mm. Impedance mismatches only cause real problems when traces are long relative to the signal wavelength. At 12 MHz, the wavelength is roughly 12 meters. Your traces are ~0.02 meters. That's over 500× shorter than the wavelength — any reflections die out before they can cause trouble.

2. **The "critical length" rule** — Signals only need impedance control when the trace is longer than about 1/6th of the rise time distance. For Full Speed USB (rise time ~4ns), that's roughly 30cm (~12 inches). Your traces are 2cm. You're well under the threshold.

3. **The FT232RL has internal termination** — The chip handles impedance matching on its end, which further reduces sensitivity to trace impedance.

**Bottom line:** For your 2-layer board running Full Speed USB with short traces, you do NOT need controlled impedance from your PCB manufacturer. Standard trace widths and good layout practices are enough.

---

## What You SHOULD Do (Good Practices You Already Follow)

Even though controlled impedance isn't critical, these layout practices keep your USB signals clean:

### 1. Keep D+ and D− as a Matched Pair
- Route them side by side on the **same layer** (top)
- Keep them the **same length** (your current mismatch is 0.001mm — essentially perfect)
- No vias on D+/D− (you already do this)

### 2. Ground Plane Underneath
- Your bottom layer is a solid GND copper pour — this is the return path for the USB signals
- **Never** route other traces on the bottom layer directly under D+/D− that could cut the ground plane
- Make sure via stitching connects top GND pads to the bottom pour

### 3. Keep D+/D− Away From Noisy Signals
- Stay ≥ 3mm from the MT3608 switching node ($1N2860) — it switches at 1.2 MHz and radiates
- Stay ≥ 2mm from RS232 lines (they swing ±9V)
- You already have the USBLC6-2SC6 (D2) for ESD protection right after the connector

### 4. Reasonable Trace Width
- Your current 10mil (0.254mm) trace width is fine for USB Full Speed
- On a 2-layer FR4 board with standard 1oz copper and ~1.6mm board thickness, 10mil traces over a ground plane give roughly 80–100 ohm single-ended impedance — close enough for Full Speed

---

## If You DID Want Controlled Impedance (For Reference)

If you ever upgrade to USB 2.0 High Speed (480 Mbps) or USB 3.x, here's what you'd need:

### Target Values
| Parameter | USB 2.0 Requirement |
|-----------|---------------------|
| Differential impedance | 90 Ω ±15% |
| Single-ended impedance | 45 Ω ±10% |
| Max length mismatch | < 150 mils (3.8mm) |
| Max total trace length | < 4 inches (100mm) |

### How Trace Geometry Affects Impedance

```
                 ┌─ Trace Width (w) ─┐
                 ╔═══════════════════╗  ─┐
                 ║   D+ trace        ║   │ Copper thickness (t)
                 ╚═══════════════════╝  ─┘
                           ← gap (s) →
                 ╔═══════════════════╗
                 ║   D− trace        ║
                 ╚═══════════════════╝
─────────────────────────────────────────── Dielectric (FR4, εr ≈ 4.5)
                                            height (h) to ground plane
═══════════════════════════════════════════ Ground Plane (bottom layer)
```

**What makes impedance go UP:**
- Narrower traces (smaller w)
- Wider gap between D+ and D− (bigger s)
- Thicker dielectric (bigger h — more distance to ground plane)

**What makes impedance go DOWN:**
- Wider traces (bigger w)
- Smaller gap between D+ and D− (smaller s)
- Thinner dielectric (closer to ground plane)

### Typical Values for 90Ω Differential on 2-Layer FR4

For a standard 1.6mm thick FR4 board, 1oz copper:
- **Trace width:** ~7–8 mil (0.18–0.20mm)
- **Gap between traces:** ~6 mil (0.15mm)
- **Dielectric height to ground:** ~1.5mm (your bottom GND pour)

These values give approximately 90Ω differential impedance. But you'd need to verify with a calculator or your PCB fab's impedance service.

---

## How to Set This Up in EasyEDA Pro (If You Need It Later)

### Step 1: Define the Differential Pair
1. Your nets are already named `UD+` and `UD-` — EasyEDA Pro recognizes `XXX+`/`XXX-` naming as differential pairs automatically
2. Go to **PCB Editor → Tool → Differential Pair Manager**
3. Click "Auto Generate" — it should find UD+/UD- as a pair
4. Or manually add: prefix "UD", positive suffix "+", negative suffix "-"

### Step 2: Set Design Rules
1. Go to **Top Menu → Tool → Design Rule**
2. Under "Differential Pair" rules, set:
   - **Trace width:** 7–8 mil (for 90Ω, if you need it; 10 mil is fine for your current design)
   - **Gap/clearance:** 6 mil
   - **Length tolerance:** 5 mil (how much mismatch is allowed)

### Step 3: Route the Pair
1. **Route → Differential Pair Routing** (or press the differential pair button in the routing toolbar)
2. Click on UD+ at the USB-C connector (J1)
3. EasyEDA Pro routes both D+ and D- simultaneously, keeping them matched
4. Route the path: J1 → D2 (USBLC6) → U1 (FT232RL)

### Step 4: Length Tuning (If Needed)
1. After routing, go to **Route → Differential Pair Equal Length Tuning**
2. Click on the shorter trace
3. EasyEDA adds a serpentine (snake) pattern to match the length of the longer trace
4. Your current mismatch is 0.001mm — you don't need this

### Step 5: Order Controlled Impedance from JLCPCB (If Needed)
1. When ordering, check "Impedance Control" on JLCPCB
2. Select "JLC0461H-7628" or similar stackup
3. JLCPCB adjusts trace width during manufacturing to hit your target impedance
4. Adds ~$5-10 to the order cost
5. **For your current Full Speed design: this is NOT necessary**

---

## Summary for Your FLARM USB Updater

| Question | Answer |
|----------|--------|
| Do I need controlled impedance? | **No** — Full Speed USB, short traces, 2-layer board |
| What trace width for D+/D−? | **10 mil is fine** |
| Do I need to order "impedance controlled" PCB? | **No** — saves you $5-10 per order |
| Is my current layout OK? | **Yes** — matched pair, same layer, solid ground plane, ESD protection in place |
| When would I need impedance control? | If you upgrade to High Speed (480 Mbps) USB or traces exceed ~100mm |

Your current design is well-executed for USB Full Speed. The matched trace lengths (0.001mm mismatch), solid ground pour, and ESD protection are exactly what's needed. Don't over-engineer it!

---

## Sources & Further Reading

- [USB Design Guidelines — Cadence](https://resources.pcb.cadence.com/blog/2025-usb-design-guidelines)
- [Impedance Matching for USB Interfaces — Cadence](https://resources.pcb.cadence.com/blog/2024-impedance-matching-for-usb-interfaces-in-pcbs)
- [USB 2.0 Routing on 2-Layer PCB — Altium](https://resources.altium.com/p/routing-requirements-usb-20-2-layer-pcb)
- [USB PCB Routing Guide — Autodesk Fusion 360](https://www.autodesk.com/products/fusion-360/blog/pcb-routing-requirements-usb-ultimate-guide/)
- [Differential Pair Routing — EasyEDA Pro Docs](https://prodocs.easyeda.com/en/pcb/route-differential-pair-routing/)
- [Differential Pair Manager — EasyEDA Pro Docs](https://prodocs.easyeda.com/en/pcb/design-differential-pair-manager/)
- [Differential Pair Length Tuning — EasyEDA Pro Docs](https://prodocs.easyeda.com/en/pcb/route-differential-pair-equal-length-tuning/)
