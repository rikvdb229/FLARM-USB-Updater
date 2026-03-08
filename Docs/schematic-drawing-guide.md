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
│  [R4, R5]                                      [U4 AMS1117-3.3]    │
│  [C14]                                         [C15, C16]           │
│   USB-C         USB-UART        RS232           CONNECTOR + LDO    │
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
| `V3V3` | AMS1117-3.3 output (3.3V to RJ45 pin 3) |

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
U2 T2IN  ── J3 pin 1 (header pad)       (channel 2 breakout — see below)
U2 T2OUT ── J3 pin 2 (header pad)
U2 R2IN  ── J3 pin 3 (header pad)
U2 R2OUT ── J3 pin 4 (header pad)
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
C12 other side ── GND                   (100nF decoupling — FT232RL internal use only)
```

**USB data pins (connect to D2 via net labels):**
```
U1 USBDP ── net label UD+               (→ D2 I/O1 → J1 D+)
U1 USBDM ── net label UD−               (→ D2 I/O2 → J1 D−)
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
U1 RI#   ── GND    ← ring indicator input, tie low when unused
```

**Truly unused — add No-connect (X):**
```
U1 RTS#   ── X
U1 DTR#   ── X
U1 RESET  ── X    ← has internal pull-up; leave as NC
U1 OSCI   ── X    ← internal oscillator, no crystal needed
U1 OSCO   ── X
U1 CBUS2  ── X
U1 CBUS3  ── X
U1 CBUS4  ── X
```

> Note: PWREN# does not appear in the EasyEDA symbol for C8690 — this is normal, ignore it.

---

## 9. Block 4 — USB-C Input

**Place:** J1 (C165948), D2 (C7519), R4 (C25905), R5 (C25905), C14 (C307331)

**Power:**
```
J1 VBUS (all VBUS pins) ── net label VUSB   (A4, A9, B4, B9 — tie all together)
J1 GND  (all GND pins)  ── GND
J1 EH   (all EH pins)   ── GND              (exposed housing / shield tabs)
```

**CC pull-downs** (signals plugged device as power sink):
```
J1 CC1 ── R4 one side
R4 other side ── GND                    (5.1kΩ)
J1 CC2 ── R5 one side
R5 other side ── GND                    (5.1kΩ)
```

**USB data through ESD clamp D2 (USBLC6-2SC6):**

USB-C is reversible — there are TWO D+/D− pairs (DP1/DN1 and DP2/DN2), one for each cable orientation.
Tie both pairs together so the device works regardless of how the cable is inserted:

```
J1 DP1 ──┐
          ├── net label UD+  (→ D2 I/O1 → U1 USBDP)
J1 DP2 ──┘

J1 DN1 ──┐
          ├── net label UD−  (→ D2 I/O2 → U1 USBDM)
J1 DN2 ──┘

D2 pin 1 (I/O1) ── net label UD+
D2 pin 6 (I/O1) ── net label UD+
D2 pin 3 (I/O2) ── net label UD−
D2 pin 4 (I/O2) ── net label UD−
D2 pin 2 (GND)  ── GND
D2 pin 5 (VBUS) ── VUSB
C14 one side ── VUSB, other ── GND      (100nF bypass on D2 pin 5)
```

USBLC6-2SC6 SOT-23-6 pin map:
- Pin 1 = I/O1 (D+)
- Pin 2 = GND
- Pin 3 = I/O2 (D−)
- Pin 4 = I/O2 (D−)  ← NOT VCC
- Pin 5 = V_BUS      ← this is the VCC/power pin
- Pin 6 = I/O1 (D+)

> In EasyEDA: wire DP1 and DP2 both to the same UD+ net label. Wire DN1 and DN2 both to UD−.

**Unused J1 pins:**
```
J1 SBU1, SBU2 ── X (no-connect — sideband for alternate modes, not used)
```

---

## 10. Block 5 — RJ45 Output

**Place:** J2 (C2683360), R7 (C25077)

```
J2 pin 1 ── V12_OUT
J2 pin 2 ── V12_OUT
J2 pin 3 ── R7 one side
R7 other side ── net label V3V3          (10Ω current-limit from AMS1117-3.3 output)
J2 pin 4 ── GND
J2 pin 5 ── net label RS232_RX          (← from MAX3232 R1IN)
J2 pin 6 ── net label RS232_TX          (→ to MAX3232 T1OUT)
J2 pin 7 ── GND
J2 pin 8 ── GND
J2 pin 9 ── GND                         (shield tab)
J2 pin 10 ── GND                        (shield tab)
```

---

## 11. Block 6 — AMS1117-3.3 LDO (3.3V for display power)

**Place:** U4 (C6186), C15 (C45783), C16 (C45783)

**Wire up:**
```
U4 Vin   ── net label VUSB
U4 GND   ── GND
U4 Vout  ── net label V3V3
```

**Input cap:**
```
C15 + side ── VUSB, C15 − side ── GND   (22µF/25V 0805)
```

**Output cap:**
```
C16 + side ── V3V3, C16 − side ── GND   (22µF/25V 0805)
```

> V3V3 net connects to R7 (section 10) → RJ45 pin 3.
> During FLARM updates, FLARM also drives pin 3 at 3.3V; R7 (10Ω) limits any current mismatch.

---

## 12. Block 7 — LED Indicators

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

## 13. Block 8 — Breakout Headers (J3, J4)

Two through-hole headers (2.54mm pitch PTH pads). Leave unpopulated on assembled boards — solder a pin header when needed.

**J3 — MAX3232 Channel 2 Breakout (1×4 header)**

Place a 1×4 PTH header near U2. No JLCPCB part needed (hand-solder).

```
J3 pin 1 ── U2 T2IN   (TTL input  — feed a TX signal here)
J3 pin 2 ── U2 T2OUT  (RS232 output — level-shifted from T2IN)
J3 pin 3 ── U2 R2IN   (RS232 input  — connect RS232 source here)
J3 pin 4 ── U2 R2OUT  (TTL output — level-shifted from R2IN)
```

> **Example use:** Jumper J3 pin 1 to J4 pin 1 (UART_TX) → get a second RS232 TX
> output on J3 pin 2. Acts as a serial tap/mirror of the main TX channel.

**J4 — TTL UART Breakout (1×3 header)**

Place a 1×3 PTH header near U1. Exposes the TTL-level UART signals for devices
that speak TTL serial directly (bypassing RS232 level shifting).

```
J4 pin 1 ── net label UART_TX          (5V TTL TX from FT232RL)
J4 pin 2 ── net label UART_RX          (5V TTL RX to FT232RL)
J4 pin 3 ── GND                        (signal reference)
```

> These are the same nets that connect to U2 T1IN and U2 R1OUT. Adding J4 pads
> does not change the existing circuit — it just exposes the signals.

---

## 14. Clean Up Schematic

1. Add **component values** to all passives (double-click → edit Value field):
   - R1–R9: 100k, 5.1k, 10k, 5.1k, 5.1k, 1k, 10R, 1k, 1k
   - C1–C16: 22µF/25V, 100n, 22µF/25V, 4.7µF, 100n, 100n, 100n, 100n, 100n, 4.7µF, 100n, 100n, 100n, 100n, 22µF/25V, 22µF/25V
2. Verify all **designators** match R1–R9, C1–C16, LED1–3, U1–U4, L1, D1–D2, J1–J4
3. Add a **design note text box** near the schematic:
   ```
   FLARM USB Updater v1.0
   USB → 12V boost → FLARM RJ45
   FT232RL uses usbser.sys (no driver install)
   ```

---

## 15. ERC (Electrical Rules Check)

1. **Design → Electrical Rules Check**
2. Resolve all errors — common ones:
   - "Pin unconnected": check FT232RL unused pins have X (no-connect)
   - "Power pin not driven": verify VUSB net has a power source (J1 VBUS)
3. Warnings about intentional no-connects are OK if you placed X flags

**Target: 0 errors, 0 warnings**

---

## 16. Verification Checklist (before export)

- [ ] VBOOST connects only to: MT3608 output + C3 + C4 + D1 anode
- [ ] V12_OUT connects only to: D1 cathode + J2 pin 1 + J2 pin 2
- [ ] U1 TEST → GND (not NC!)
- [ ] U1 CTS#, DSR#, DCD# → GND
- [ ] U1 CBUS0 → TXLED net → LED2 cathode
- [ ] U1 CBUS1 → RXLED net → LED3 cathode
- [ ] J2 pin 3 → R7 → V3V3 net → U4 Vout (AMS1117-3.3)
- [ ] U4 Vin → VUSB, U4 GND → GND, C15 + C16 placed
- [ ] J2 pins 9, 10 (shield) → GND
- [ ] D2 placed in the D+/D− path between J1 and U1
- [ ] R4, R5 (5.1kΩ) on CC1 and CC2 → GND
- [ ] J3 (1×4): T2IN, T2OUT, R2IN, R2OUT connected to U2 channel 2 pins
- [ ] J4 (1×3): UART_TX, UART_RX, GND connected

---

## 17. Export

**PDF (for review):**
File → Export → Export PDF → save as `EasyEDA/schematic.pdf`

**BOM (for JLCPCB):**
Fabrication → BOM → Export → save as `Docs/bom.csv`

**Gerbers + CPL (when PCB is done):**
Fabrication → Fabrication Output → save into `Docs/`
