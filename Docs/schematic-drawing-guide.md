# EasyEDA Pro — Schematic Drawing Guide
## FLARM USB Updater

---

## 0. EasyEDA Pro Keyboard Shortcuts (reference)

| Key | Action |
|-----|--------|
| W | Wire tool |
| N | Net label |
| P | Power port (GND, VCC) |
| X | No-connect flag |
| R | Rotate component (while placing) |
| G | Move component + connected wires |
| Ctrl+D | Duplicate |
| Ctrl+Z | Undo |
| Escape | Cancel current tool |
| Ctrl+S | Save |

---

## 1. Block Placement on the Sheet

Follow **left-to-right signal flow** and **top-to-bottom power flow** — the two standard schematic conventions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                   [MT3608 + L1 + D1 + C1-C4 + R1-R3]               │
│                         BOOST CONVERTER (top centre)                │
│                                                                     │
│  [J1 USB-C]    [FT232RL U1]    [MAX3232 U2]    [J2 RJ45]           │
│  [D2 USBLC6]   [C10-C13]      [C5-C9]         [R7]                 │
│  [R4, R5]                                                           │
│  [C14]                                                              │
│   USB-C         USB-UART        RS232           CONNECTOR           │
│   (left)        (centre-left)   (centre-right)  (right)            │
│                                                                     │
│              [LED1 LED2 LED3 + R6 R8 R9]                           │
│                  INDICATORS (bottom centre)                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Why this layout:**
- Signal flows left → right: USB-C → FT232RL → MAX3232 → RJ45
- Power block sits above the signal path (boost feeds V12_OUT down to RJ45)
- LEDs hang off the bottom — they're a side branch, not in the main signal path
- GND symbols hang downward everywhere — visually clean

**Practical spacing tips:**
- Leave ~3–4 grid squares between block edges — enough room for bypass caps and labels
- Place decoupling caps directly beside their IC's power pins (shorter stubs = cleaner)
- Put charge pump caps (C6–C9) clustered around U2 — they're only connected to U2
- Put the boost feedback divider (R1, R2) below U3's FB pin, both vertically stacked
- Group LEDs in a row horizontally — they'll look like a row on the physical PCB edge

---

## 2. Project Setup

1. Open **EasyEDA Pro** (desktop app)
2. **File → New Project** → name it `FLARM-USB-Updater`
3. A blank schematic sheet opens automatically — this is your only sheet
4. **File → Save to Computer** → save into `d:\CodeProjects\FLARM-USB-Updater\EasyEDA\`
   - Filename: `FLARM-USB-Updater.epro`
5. Set sheet title: right-click the title block (bottom-right corner) → Edit → set:
   - Title: `FLARM USB Updater`
   - Rev: `1.0`

---

## 3. How to Place Components (use this for every IC / connector)

1. Open **Parts panel** (left sidebar)
2. Click the **JLCPCB** tab
3. In the search box type the **C-number** (e.g. `C8690`)
4. Click the result → it loads the symbol
5. Click on the schematic to place it
6. Press **R** to rotate before clicking if needed
7. Press **Escape** when done placing

> For resistors / caps: search by C-number the same way.
> EasyEDA Pro will auto-fill the JLCPCB part number and footprint.

---

## 4. How to Connect Components

**Wires:** Press **W**, click the start pin, click the end pin, press Escape.

**Net labels** (for signals that span distance, e.g. UART_TX):
- Press **N** → type the net name → click a pin to attach
- Any two pins sharing the same net label name are connected, even if not physically wired

**Power ports** (GND, VUSB etc.):
- Press **P** → search `GND` → place on every GND pin
- For custom power nets (VUSB, VBOOST, V12_OUT): use **Net Label** (N), not a power port — unless you want the power symbol style; either works

**No-connect:** Press **X** → click any unused pin that should be intentionally unconnected

---

## 5. Net Names Used in This Schematic

Use these names exactly (case-sensitive) for net labels:

| Net | Description |
|-----|-------------|
| `GND` | Ground (use power port symbol) |
| `VUSB` | USB 5V rail |
| `VBOOST` | MT3608 output (~12.36V, before diode) |
| `V12_OUT` | After B5819W diode (~12.0V to RJ45) |
| `UART_TX` | FT232RL TXD → MAX3232 T1IN |
| `UART_RX` | FT232RL RXD ← MAX3232 R1OUT |
| `RS232_TX` | MAX3232 T1OUT → RJ45 pin 6 |
| `RS232_RX` | MAX3232 R1IN ← RJ45 pin 5 |

---

## 6. Block 1 — MT3608 Boost Converter

**Place:** U3 (C84817), L1 (C135264), D1 (C8598), R1 (C25741), R2 (C25905), R3 (C25744), C1 (C45783), C2 (C307331), C3 (C45783), C4 (C1779)

**Wire up:**

```
U3 Vin  ── net label VUSB
U3 GND  ── GND power port
U3 EN   ── R3 one side
R3 other side ── net label VUSB          (10kΩ pull-up to always enable)
U3 SW   ── L1 one side
L1 other side ── net label VBOOST
U3 FB   ── junction of R1 and R2
R1 other side ── net label VBOOST        (100kΩ, top of divider)
R2 other side ── GND                     (5.1kΩ, bottom of divider)
```

**Input decoupling caps (connect to VUSB rail):**
```
C1 + side ── VUSB,  C1 − side ── GND    (22µF/25V 0805)
C2 one side ── VUSB, C2 other ── GND    (100nF 0402)
```

**Output caps (connect to VBOOST net):**
```
C3 + side ── VBOOST, C3 − side ── GND   (22µF/25V 0805)
C4 + side ── VBOOST, C4 − side ── GND   (4.7µF/25V 0805)
```

**Backfeed diode D1 (B5819W):**
```
D1 anode  ── net label VBOOST
D1 cathode ── net label V12_OUT
```

> Verify: VBOOST connects to L1, R1, C3, C4, D1 anode only.
> Verify: V12_OUT connects to D1 cathode and section 10 (RJ45) only.

---

## 7. Block 2 — MAX3232 RS232

**Place:** U2 (C7258), C5 (C307331), C6 (C307331), C7 (C307331), C8 (C307331), C9 (C307331)

**Power:**
```
U2 VCC  ── VUSB
U2 GND  ── GND
C5 + ── VUSB, C5 − ── GND               (100nF 0402, VCC bypass)
```

**Charge pump caps** (connect exactly as labeled on the MAX3232 symbol):
```
C6: C1+ pin ↔ C1− pin                   (100nF 0402)
C7: C2+ pin ↔ C2− pin                   (100nF 0402)
C8: V+  pin ── GND                      (100nF 0402)
C9: V−  pin ── GND                      (100nF 0402)
```

**Signal pins:**
```
U2 T1IN  ── net label UART_TX
U2 T1OUT ── net label RS232_TX
U2 R1IN  ── net label RS232_RX
U2 R1OUT ── net label UART_RX
U2 T2IN  ── GND                         (unused channel — tie low)
U2 R2IN  ── No-connect (X)
U2 R2OUT ── No-connect (X)
U2 T2OUT ── No-connect (X)
```

---

## 8. Block 3 — FT232RL USB-UART

**Place:** U1 (C8690), C10 (C1779), C11 (C307331), C12 (C307331), C13 (C307331)

**Power:**
```
U1 VCC    ── VUSB
U1 VCCIO  ── VUSB                       (sets IO voltage to 5V)
U1 AGND   ── GND
U1 GND    ── GND
C10 + ── VUSB, C10 − ── GND            (4.7µF bulk)
C11 one side ── VUSB, other ── GND     (100nF VCC bypass)
C13 one side ── VUSB, other ── GND     (100nF VCCIO bypass)
```

**3V3OUT (internal LDO output):**
```
U1 3V3OUT ── C12 one side
C12 other side ── GND                   (100nF decoupling — do not load this net heavily)
U1 3V3OUT ── also connects to R7 (section 10)
```

**UART signals:**
```
U1 TXD ── net label UART_TX
U1 RXD ── net label UART_RX
```

**LED signals:**
```
U1 CBUS0 (TXLED#) ── net label TXLED   (goes to section 11)
U1 CBUS1 (RXLED#) ── net label RXLED   (goes to section 11)
```

**Pins that MUST be tied to GND (not NC!):**
```
U1 TEST  ── GND    ← required by datasheet
U1 CTS#  ── GND    ← always clear-to-send
U1 DSR#  ── GND
U1 DCD#  ── GND
```

**Truly unused — add No-connect (X):**
```
U1 RTS#   ── X
U1 DTR#   ── X
U1 PWREN# ── X
U1 CBUS2  ── X
U1 CBUS3  ── X
U1 CBUS4  ── X
```

---

## 9. Block 4 — USB-C Input

**Place:** J1 (C165948), D2 (C7519), R4 (C25905), R5 (C25905), C14 (C307331)

**Power:**
```
J1 VBUS  ── net label VUSB
J1 GND   ── GND
J1 GND (all GND pins) ── GND
```

**CC pull-downs** (signals plugged device as power sink):
```
J1 CC1 ── R4 one side
R4 other side ── GND                    (5.1kΩ)
J1 CC2 ── R5 one side
R5 other side ── GND                    (5.1kΩ)
```

**USB data through ESD clamp D2 (USBLC6-2SC6):**
```
J1 D+  ── D2 I/O1
J1 D−  ── D2 I/O2
D2 I/O1 ── U1 UD+
D2 I/O2 ── U1 UD−
D2 VCC ── VUSB
D2 GND ── GND
C14 one side ── VUSB, other ── GND      (100nF bypass on D2 VCC)
```

> Note: USBLC6-2SC6 has a specific pin layout — verify the symbol's I/O1/I/O2/VCC/GND labels match the SOT-23-6 datasheet before wiring.

**Unused J1 pins:**
```
J1 SBU1, SBU2 ── X (no-connect)
J1 D+ and D− on secondary side ── X (USB-C has 2 pairs; only route one)
```

---

## 10. Block 5 — RJ45 Output

**Place:** J2 (C2683360), R7 (C25077)

```
J2 pin 1 ── V12_OUT
J2 pin 2 ── V12_OUT
J2 pin 3 ── R7 one side
R7 other side ── U1 3V3OUT              (10Ω current-limit to FT232RL LDO output)
J2 pin 4 ── GND
J2 pin 5 ── net label RS232_RX          (← from MAX3232 R1IN)
J2 pin 6 ── net label RS232_TX          (→ to MAX3232 T1OUT)
J2 pin 7 ── GND
J2 pin 8 ── GND
J2 pin 9 ── GND                         (shield tab)
J2 pin 10 ── GND                        (shield tab)
```

---

## 11. Block 6 — LED Indicators

**Place:** LED1 (C2297), LED2 (C2297), LED3 (C2296), R6 (C11702), R8 (C11702), R9 (C11702)

**Power LED (always on):**
```
VUSB ── R6 ── LED1 anode
LED1 cathode ── GND
```

**TX LED (active-low, sinks when FT232RL transmits):**
```
VUSB ── R8 ── LED2 anode
LED2 cathode ── net label TXLED         (connects to U1 CBUS0)
```

**RX LED (active-low, sinks when FT232RL receives):**
```
VUSB ── R9 ── LED3 anode
LED3 cathode ── net label RXLED         (connects to U1 CBUS1)
```

> LED anode = positive side (triangle base), cathode = negative side (bar).
> All resistors 1kΩ → 3mA at 5V, well within FT232RL 6mA sink limit.

---

## 12. Clean Up Schematic

1. Add **component values** to all passives (double-click → edit Value field):
   - R1–R9: 100k, 5.1k, 10k, 5.1k, 5.1k, 1k, 10R, 1k, 1k
   - C1–C14: 22µF/25V, 100n, 22µF/25V, 4.7µF, 100n, 100n, 100n, 100n, 100n, 4.7µF, 100n, 100n, 100n, 100n
2. Verify all **designators** match R1–R9, C1–C14, LED1–3, U1–U3, L1, D1–D2, J1–J2
3. Add a **design note text box** near the schematic:
   ```
   FLARM USB Updater v1.0
   USB → 12V boost → FLARM RJ45
   FT232RL uses usbser.sys (no driver install)
   ```

---

## 13. ERC (Electrical Rules Check)

1. **Design → Electrical Rules Check**
2. Resolve all errors — common ones:
   - "Pin unconnected": check FT232RL unused pins have X (no-connect)
   - "Power pin not driven": verify VUSB net has a power source (J1 VBUS)
3. Warnings about intentional no-connects are OK if you placed X flags

**Target: 0 errors, 0 warnings**

---

## 14. Verification Checklist (before export)

- [ ] VBOOST connects only to: MT3608 output + C3 + C4 + D1 anode
- [ ] V12_OUT connects only to: D1 cathode + J2 pin 1 + J2 pin 2
- [ ] U1 TEST → GND (not NC!)
- [ ] U1 CTS#, DSR#, DCD# → GND
- [ ] U1 CBUS0 → TXLED net → LED2 cathode
- [ ] U1 CBUS1 → RXLED net → LED3 cathode
- [ ] J2 pin 3 → R7 → U1 3V3OUT
- [ ] J2 pins 9, 10 (shield) → GND
- [ ] D2 placed in the D+/D− path between J1 and U1
- [ ] R4, R5 (5.1kΩ) on CC1 and CC2 → GND

---

## 15. Export

**PDF (for review):**
File → Export → Export PDF → save as `EasyEDA/schematic.pdf`

**BOM (for JLCPCB):**
Fabrication → BOM → Export → save as `Docs/bom.csv`

**Gerbers + CPL (when PCB is done):**
Fabrication → Fabrication Output → save into `Docs/`
