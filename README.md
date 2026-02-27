# FLARM USB Updater

USB-to-RS232 adapter with 12V boost converter for updating FLARM firmware without external power.

Plug into a PC USB port → connect RJ45 cable to FLARM → run firmware update tool. No 12V bench supply required. Also supports FLARM display firmware updates via the same connector.

## Features

- Powered entirely from USB (5V)
- 5V → ~12V boost converter (MT3608) supplies FLARM via RJ45 pins 1 & 2
- FT232RL USB-to-UART bridge — uses Microsoft built-in usbser.sys, no driver install on Win10/11
- MAX3232 RS232 level shifter (±9V signaling, compatible with all FLARM RS232 ports)
- B5819W Schottky backfeed diode — safe to plug into FLARM on live 12V aircraft bus
- USB ESD protection (USBLC6-2SC6) on D+/D−
- USB-C connector with proper CC pull-downs
- Power, TX and RX LED indicators
- RJ45 pin 3 (3.3V display power) driven from FT232RL 3V3OUT — powers FLARM displays during display firmware updates

## Hardware

Designed in **EasyEDA Pro** for direct JLCPCB SMT assembly ordering.

**PCB:** 2000 × 1200 mils (50.8 × 30.5mm), 2-layer FR4, 1oz copper.
Target after layout optimisation: 2000 × 950 mils (50.8 × 24.1mm).
See [Docs/pcb-layout-guide.md](Docs/pcb-layout-guide.md) and [Docs/pcb-layout-guide.html](Docs/pcb-layout-guide.html) for full PCB layout guidance.

> **Note on C-numbers:** IC and connector C-numbers are confirmed. Passive C-numbers
> (resistors/caps) are from the JLCPCB Basic parts library and should be verified in
> EasyEDA before ordering — search the value + package if a number doesn't match.

### Component List

| Ref | Description | JLCPCB # | Class |
|-----|-------------|-----------|-------|
| U1 | FT232RL USB-UART SSOP-28 | C8690 | Extended |
| U2 | MAX3232CSE+T RS232 transceiver | C7258 | Extended |
| U3 | MT3608 boost converter | C84817 | Extended |
| L1 | 22µH shielded inductor 1A | C135264 | Extended |
| D1 | B5819W SL Schottky 40V/1A SOD-123 | C8598 | Basic |
| D2 | USBLC6-2SC6 USB ESD clamp | C7519 | Extended |
| J1 | USB-C receptacle TYPE-C-31-M-12 | C165948 | Extended |
| J2 | RJ45 8P8C shielded KH-RJ45-58-8P8C | C2683360 | Extended |
| LED1 | Green LED 0805 — power (KT-0805G) | C2297 | Basic |
| LED2 | Green LED 0805 — TX (KT-0805G) | C2297 | Basic |
| LED3 | Yellow LED 0805 — RX (KT-0805Y) | C2296 | Basic |
| R1 | 100kΩ 0402 — MT3608 FB top | C25741 | Basic |
| R2 | 5.1kΩ 0402 — MT3608 FB bottom | C25905 | Basic |
| R3 | 10kΩ 0402 — MT3608 EN pull-up | C25744 | Basic |
| R4 | 5.1kΩ 0402 — USB-C CC1 | C25905 | Basic |
| R5 | 5.1kΩ 0402 — USB-C CC2 | C25905 | Basic |
| R6 | 1kΩ 0402 — power LED current | C11702 | Basic |
| R7 | 10Ω 0402 — RJ45 pin 3 current limit | C25077 | Basic |
| R8 | 1kΩ 0402 — TX LED current | C11702 | Basic |
| R9 | 1kΩ 0402 — RX LED current | C11702 | Basic |
| C1 | 22µF / 25V 0805 — MT3608 Vin | C45783 | Basic |
| C2 | 100nF 0402 — MT3608 Vin | C307331 | Basic |
| C3 | 22µF / 25V 0805 — MT3608 Vout | C45783 | Basic |
| C4 | 4.7µF / 25V 0805 — MT3608 Vout aux | C1779 | Basic |
| C5 | 100nF 0402 — MAX3232 VCC | C307331 | Basic |
| C6 | 100nF 0402 — MAX3232 CP1 | C307331 | Basic |
| C7 | 100nF 0402 — MAX3232 CP2 | C307331 | Basic |
| C8 | 100nF 0402 — MAX3232 V+ | C307331 | Basic |
| C9 | 100nF 0402 — MAX3232 V- | C307331 | Basic |
| C10 | 4.7µF / 25V 0805 — FT232RL VCC bulk | C1779 | Basic |
| C11 | 100nF 0402 — FT232RL VCC | C307331 | Basic |
| C12 | 100nF 0402 — FT232RL 3V3OUT | C307331 | Basic |
| C13 | 100nF 0402 — FT232RL VCCIO | C307331 | Basic |
| C14 | 100nF 0402 — USBLC6 VCC | C307331 | Basic |

**32 components — 7 Extended parts ($21 in JLCPCB setup fees)**

Unique passive C-numbers: only 6 distinct parts cover all 25 passives.

### FLARM RJ45 Pinout (8P8C shielded)

| Pin | Signal | This device |
|-----|--------|-------------|
| 1, 2 | +12V | From boost via D1 (~12.0V) |
| 3 | FLARM 3V3 | From FT232RL 3V3OUT via R7 (10Ω) |
| 4, 7, 8 | GND | PCB GND |
| 5 | FLARM TX | RS232 RX input |
| 6 | FLARM RX | RS232 TX output |
| 9, 10 | Shield | PCB GND copper pour |

**Pin 3 note:** R7 (10Ω) always populated — bridges FT232RL 3V3OUT to RJ45 pin 3.
- FLARM update: FLARM drives pin 3 itself; R7 limits any current mismatch. Safe.
- Display update: FT232RL 3V3OUT (50mA max) powers display via R7. Display current draw is low (~10–25mA); voltage drop across R7 is negligible. FT232RL 3V3OUT is sufficient.

### LED Indicators

| LED | Colour | Signal | Behaviour |
|-----|--------|--------|-----------|
| LED1 | Green (C2297) | VUSB | Always on when USB connected |
| LED2 | Green (C2297) | FT232RL TXLED# (CBUS0) | Flashes during data transmission |
| LED3 | Yellow (C2296) | FT232RL RXLED# (CBUS1) | Flashes during data reception |

TXLED# and RXLED# are active-low, default CBUS0/CBUS1 factory config — no EEPROM needed.
Wiring: VUSB → 1kΩ → LED anode → cathode → TXLED#/RXLED# pin.

## Power Notes

- Typical USB draw: ~210 mA (USB 2.0 / 500 mA limit OK)
- Peak USB draw: ~380 mA (FLARM GPS acquisition)
- Recommended: USB 3.0 port or powered hub for full margin

## Boost Converter Output

Vout = 0.6 × (1 + R1/R2) = 0.6 × (1 + 100k/5.1k) ≈ **12.36V**
After B5819W drop (~0.4V): ≈ **12.0V** at RJ45 — nominal aircraft voltage, within FLARM 8–36V range.
Output caps: C3 + C4 (22µF + 4.7µF at 25V — 2× margin over 12.36V output).

## Cost Estimate (JLCPCB SMT assembly)

| Qty | PCB | SMT | Extended fees | Components | Shipping | Total | Per board |
|-----|-----|-----|---------------|------------|----------|-------|-----------|
| 5 | $2 | $8 | $21 | ~$37.50 | ~$15 | ~$83.50 | ~$16.70 |
| 10 | $4 | $8 | $21 | ~$75 | ~$15 | ~$123 | ~$12.30 |

## PCB Layout Notes

Critical items verified during schematic review:
- Boost converter wiring correct: MT3608 pin 1 = SW → L1, pin 4 = EN → R3 pull-up ✅
- MAX3232 charge pump caps (C6–C9) correctly connected ✅
- RJ45 pinout matches FLARM IGC specification ✅
- FLARM protocol: 19200 baud, 8N1, no flow control — FT232RL supports this ✅

**Must verify in EasyEDA schematic before ordering:**
- FT232RL TEST pin (SSOP-28 pin 26) → GND *(mandatory — chip won't work otherwise)*
- FT232RL CTS#, DSR#, DCD# → GND *(prevents COM port issues on Windows)*

PCB routing requirements:
- VUSB / VBOOST / SW traces: **20mil**
- V12_OUT traces: **15mil**
- Signal traces (UART, RS232, LED, USB D+/D−): **10mil** (EasyEDA default)
- USB D+ and D− routed as equal-length differential pair (target mismatch < 20mil)
- GND copper pour on **bottom layer only** with via stitching every 6–8mm

## Files

- `EDA/` — EasyEDA Pro project file (.eprj) and netlist export
- `Docs/schematic-drawing-guide.md` / `.html` — schematic block-by-block wiring guide
- `Docs/pcb-layout-guide.md` / `.html` — PCB layout, trace widths, D+/D− routing, GND pour
