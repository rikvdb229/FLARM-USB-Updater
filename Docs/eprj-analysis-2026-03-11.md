# eprj PCB Analysis — 2026-03-11

Full analysis of `EDA/USB_FLARM_UPDATER.eprj` (saved 2026-03-11 11:12) compared to the
previously verified netlist (`Docs/netlist_pcb.asc`, 2026-03-10).

---

## 1. Design Changes Since Last Verified Netlist

The schematic and PCB were modified after the netlist export. Changes found:

| Item | Old (netlist, verified) | New (eprj) | Impact |
|------|------------------------|------------|--------|
| J2 | J2 (KH-RJ45-58-8P8C) | **RJ1** (KH-5224-8P8C) | Designator + part change |
| R6 | 1k 0402 (power LED) | **REMOVED** | LED1 circuit reworked |
| R8 | 1k 0402 (TX LED) | **330 ohm** — repurposed as power LED | Now drives LED1 |
| R9 | 1k 0402 (RX LED) | **330 ohm** (RX LED) | Value changed |
| R10 | did not exist | **330 ohm** 0402 — NEW | TX LED resistor |
| LED1 | KT-0805G (C2297) | **0805G (Green)** | Possibly same part |
| LED2 | KT-0805G (C2297) | **17-21SUYC/TR8** | Different part (Everlight) |
| LED3 | KT-0805Y (C2296) | **E6C0805UR** | Different part |

**Component count:** 38 (was 37 in BOM — R6 removed, R10 added = net +0, but J3 now
counted as component = 38 total on PCB).

---

## 2. FT232RL CBUS LED Drive — How It Works

The FT232RL has configurable CBUS pins. The default EEPROM settings are:

- **CBUS0 = TXLED#** (active-low transmit indicator)
- **CBUS1 = RXLED#** (active-low receive indicator)

### Active-Low Behavior

The `#` suffix means **active-low**. During data transmission/reception:

- **Idle (no data):** CBUS pin is HIGH (driven to VCCIO level, ~5V in our design)
- **Active (data flowing):** CBUS pin is pulled LOW (near 0V) — the FT232RL **sinks
  current** through the pin to ground

### CBUS Pin Electrical Specs (from FT232R datasheet)

- Output drive: **up to 8mA sink**, ~4mA source (CMOS push-pull output)
- Output voltage LOW: < 0.4V at 8mA sink
- Output voltage HIGH: VCCIO - 0.4V

### Correct LED Circuit (FTDI Recommended)

The FT232R datasheet shows this LED connection:

```
       VCCIO (5V)
          |
          R (resistor)
          |
     LED anode (+)
          |
     LED cathode (-)
          |
       CBUS pin (TXLED# or RXLED#)
```

**How it works:**
- When CBUS is HIGH (idle): Both sides of the LED are at ~5V. No voltage across LED.
  LED is OFF.
- When CBUS goes LOW (active): 5V across R+LED. Current flows VCCIO -> R -> LED -> CBUS.
  LED turns ON.

**Key point:** The LED cathode connects to the CBUS pin. The FT232RL sinks current
through the LED to turn it on.

### LED Current Calculation

With our VCCIO = 5V (VUSB), LED forward voltage ~2V, and resistor R:

| Resistor | Current | Brightness |
|----------|---------|------------|
| 1k ohm (old design) | (5 - 2) / 1000 = **3mA** | Dim but visible |
| 330 ohm (new design) | (5 - 2) / 330 = **9mA** | Bright, within 8mA CBUS limit* |

*At 9mA the CBUS pin is slightly over its 8mA rated sink. The LED forward voltage
may be higher than 2V for some colors (yellow/red ~2.0V, green ~2.2V), so actual
current could be closer to 8mA. Should be fine in practice, but if concerned, use
390 ohm (7.7mA) or 470 ohm (6.4mA) instead.

### Power LED (LED1)

LED1 is always-on (no CBUS control):

```
       VUSB (5V)
          |
          R8 (330 ohm)
          |
     LED1 anode (pin 1)
          |
     LED1 cathode (pin 2)
          |
         GND
```

Current: (5 - 2) / 330 = 9mA. Standard forward-biased LED. **This is correct.**

---

## 3. LED2 and LED3 Circuit Analysis — THE CRITICAL QUESTION

### What the eprj PCB shows

From the pad-net extraction:

```
LED2:  pin 1 = $1N11287,  pin 2 = VUSB
R10:   pin 1 = $1N11287,  pin 2 = TXLED (U1 pin 23, CBUS0)

LED3:  pin 1 = $1N11289,  pin 2 = VUSB
R9:    pin 1 = $1N11289,  pin 2 = RXLED (U1 pin 22, CBUS1)
```

### Circuit Topology

```
       VUSB (5V)
          |
     LED pin 2
          |
     LED pin 1
          |
          R (330 ohm)
          |
       CBUS pin (TXLED# or RXLED#)
```

### Two Scenarios — Depends on LED Pin Polarity

#### Scenario A: Pin 1 = Anode, Pin 2 = Cathode (standard 0805 convention)

```
       VUSB (5V)
          |
     cathode (pin 2)    <-- WRONG SIDE
          |
     anode (pin 1)      <-- WRONG SIDE
          |
          R (330 ohm)
          |
       CBUS pin (LOW when active)
```

When CBUS goes LOW: anode is pulled toward 0V, cathode is at 5V.
**LED is REVERSE-BIASED. Will NOT light up. CIRCUIT IS WRONG.**

#### Scenario B: Pin 1 = Cathode, Pin 2 = Anode (reversed convention)

```
       VUSB (5V)
          |
     anode (pin 2)      <-- correct, high side
          |
     cathode (pin 1)    <-- correct, low side
          |
          R (330 ohm)
          |
       CBUS pin (LOW when active)
```

When CBUS goes LOW: cathode is pulled toward 0V, anode is at 5V.
**LED is FORWARD-BIASED. Will light up. CIRCUIT IS CORRECT.**

### What You Must Check

Open EasyEDA and check the **symbol** for these two LED parts:

1. **17-21SUYC/TR8** (LED2 — Everlight, yellow/green)
2. **E6C0805UR** (LED3 — red)

In the symbol editor, look at pin 1:
- If pin 1 has the **triangle tip / cathode bar (K)**: Scenario B — circuit is CORRECT
- If pin 1 has the **triangle base / anode (A)**: Scenario A — circuit is WRONG,
  LEDs must be flipped (swap pin 1 and pin 2 connections, or rotate 180 degrees)

**Note:** The original LED (KT-0805G, C2297) uses pin 1 = anode, pin 2 = cathode
(standard). If the new LEDs follow the same convention, the circuit is wrong.

---

## 4. Everything Else — Verified Correct

### All Non-LED Connections Match

Every IC, passive, and connector connection was verified against the eprj pad-net data:

| Block | Status | Notes |
|-------|--------|-------|
| FT232RL (U1) — all 28 pins | OK | TEST->GND, status pins->GND, OSCI/OSCO NC |
| MAX3232 (U2) — all 16 pins | OK | Charge pump C6-C9 correct, ch2 NC |
| MT3608 (U3) — boost converter | OK | SW, FB divider, EN pullup all correct |
| AMS1117-3.3 (U4) — LDO | OK | V3V3 -> R7 -> RJ1 pin 3 |
| USB-C (J1) + USBLC6 (D2) | OK | CC pulldowns, D+/D- through ESD |
| RJ45 (RJ1) — all 10 pins | OK | Matches FLARM IGC spec exactly |
| J3 — TTL UART header | OK | UART_TX, UART_RX, GND |
| All decoupling caps | OK | Every IC power pin has bypass cap |

### Trace Widths — Correct

| Width | Nets | Guideline |
|-------|------|-----------|
| 20 mil | VUSB, VBOOST, SW ($1N2860), FB ($1N2875), V12_OUT, V3V3, $1N3570 | Power: 20 mil (correct) |
| 10 mil | UART, RS232, USB D+/D-, LED signals, charge pump | Signal: 10 mil (correct) |

### Via Sizes — Correct

All 61 vias: 12 mil drill, 24 mil OD. Meets JLCPCB minimum (0.3mm = 11.8 mil).

### Copper Pours

- **Layer 1 (top):** GND pour, SOLID fill, 8 mil clearance
- **Layer 2 (bottom):** GND pour, SOLID fill, 8 mil clearance
- Unfilled areas on top layer near dense routing are normal (clearance gaps)

### Routing Stats

- 358 traces, 61 vias, 38 components, 29 nets
- **No single-pad nets** (no unrouted connections detected)
- Board outline: ~2500 x 1200 mils (63.5 x 30.5 mm)

---

## 5. Designator and BOM Changes for README

The README BOM table needs updating to match the current eprj:

| Change | Old | New |
|--------|-----|-----|
| Remove | R6 (1k, C11702) | — |
| Change | R8: 1k C11702 "TX LED" | R8: 330 ohm "power LED" |
| Change | R9: 1k C11702 "RX LED" | R9: 330 ohm "RX LED" |
| Add | — | R10: 330 ohm "TX LED" |
| Change | J2: KH-RJ45-58-8P8C C2683360 | RJ1: KH-5224-8P8C (verify C-number) |
| Change | LED2: KT-0805G C2297 | 17-21SUYC/TR8 (verify C-number) |
| Change | LED3: KT-0805Y C2296 | E6C0805UR (verify C-number) |
| Count | 37 components | 38 components |

---

## 6. Pre-Order Checklist

- [ ] **Verify LED2/LED3 pin polarity** in EasyEDA symbol editor (Section 3)
- [ ] If LEDs are wrong: rotate 180 degrees or swap net connections in schematic
- [ ] Re-export netlist from schematic (sync H1->J3 and all LED changes)
- [ ] Update README BOM table with new parts and designators
- [ ] Verify JLCPCB C-numbers for new LED parts and RJ1
- [ ] Check R8/R9/R10 are 330 ohm (9mA) — consider 390 ohm if CBUS 8mA limit is concern
- [ ] Run ERC in EasyEDA (target: 0 errors)
- [ ] Run DRC in EasyEDA (target: 0 errors)
- [ ] Rebuild copper pours before Gerber export
- [ ] Check for isolated copper islands on top layer
- [ ] Export BOM + CPL, verify component orientations in JLCPCB 3D viewer
- [ ] Export Gerbers, review in JLCPCB online viewer

---

## 7. Summary

**The core design (USB, UART, RS232, boost, LDO, RJ45) is verified correct and
unchanged.** Trace widths, via sizes, and copper pours are good.

**The only risk is the LED2/LED3 pin polarity.** If the new LED parts (17-21SUYC/TR8
and E6C0805UR) have pin 1 = cathode, the circuit works. If pin 1 = anode (standard
0805 convention), the LEDs are reverse-biased and will never light up.

The LEDs are non-critical to board function — FLARM updates will work regardless.
But it's worth getting right before ordering.
