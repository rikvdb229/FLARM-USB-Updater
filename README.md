# FLARM USB Updater

USB-to-RS232 adapter with 12V boost converter for updating FLARM firmware without external power.

Plug into a PC USB port → connect RJ45 cable to FLARM → run firmware update tool. No 12V bench supply required.

## Features

- Powered entirely from USB (5V)
- 5V → ~11V boost converter (MT3608) supplies FLARM via RJ45 pins 1 & 2
- FT232RL USB-to-UART bridge (enumerates as virtual COM port, no driver install on Win10/11)
- MAX3232 RS232 level shifter (±9V signaling, compatible with all FLARM RS232 ports)
- SS34 Schottky backfeed diode — safe to plug into FLARM on live 12V aircraft bus
- USB ESD protection (USBLC6-2SC6) on D+/D−
- USB-C connector with proper CC pull-downs

## Hardware

Designed in **EasyEDA Pro** for direct JLCPCB SMT assembly ordering.

### Component List

| Ref  | Description                     | JLCPCB #  | Class    |
|------|---------------------------------|-----------|----------|
| U1   | FT232RL USB-UART bridge         | C8690     | Extended |
| U2   | MAX3232CSE+T RS232 transceiver  | C7258     | Extended |
| U3   | MT3608 boost converter          | C84817    | Extended |
| L1   | 22 µH shielded inductor, 1A     | C190170   | Extended |
| D1   | SS34 Schottky 3A/40V            | C8598     | Extended |
| D2   | USBLC6-2SC6 USB ESD clamp       | C7519     | Extended |
| J1   | USB-C receptacle TYPE-C-31-M-12 | C165948   | Extended |
| J2   | RJ45 8P8C KH-RJ45-58-8P8C      | C2683360  | Extended |
| LED1 | Green LED 0805                  | C84256    | Basic    |
| C1   | 22 µF / 10V 0805                | —         | Basic    |
| C2   | 100 nF 0402                     | —         | Basic    |
| C3   | 22 µF / 25V 0805                | —         | Basic    |
| C4   | 100 nF 0402 (MAX3232 CP1)       | —         | Basic    |
| C5   | 100 nF 0402 (MAX3232 CP2)       | —         | Basic    |
| C6   | 1 µF 0402 (MAX3232 V+)          | —         | Basic    |
| C7   | 1 µF 0402 (MAX3232 V−)          | —         | Basic    |
| C8   | 100 nF 0402                     | —         | Basic    |
| C9   | 100 nF 0402                     | —         | Basic    |
| C10  | 100 nF 0402                     | —         | Basic    |
| C11  | 4.7 µF 0805                     | —         | Basic    |
| C12  | 100 nF 0402                     | —         | Basic    |
| R1   | 10 kΩ 0402                      | —         | Basic    |
| R2   | 1.8 MΩ 0402                     | —         | Basic    |
| R3   | 100 kΩ 0402                     | —         | Basic    |
| R4   | 10 kΩ 0402                      | —         | Basic    |
| R5   | 1 MΩ 0402                       | —         | Basic    |
| R6   | 5.1 kΩ 0402 (×2)                | —         | Basic    |
| R7   | 1 kΩ 0402                       | —         | Basic    |
| R8   | 0 Ω / DNP 0402                  | —         | Basic    |

### FLARM RJ45 Pinout (8P8C)

| Pin    | Signal   | This device         |
|--------|----------|---------------------|
| 1, 2   | +12V     | From boost (via D1) |
| 3      | FLARM 3V3 | NC                 |
| 4,7–10 | GND      | PCB GND             |
| 5      | FLARM TX | RS232 RX input      |
| 6      | FLARM RX | RS232 TX output     |

## Power Notes

- Typical USB draw: ~210 mA (USB 2.0 / 500 mA limit OK)
- Peak USB draw: ~380 mA (FLARM GPS acquisition)
- Recommended: USB 3.0 port or powered hub for full margin

## Boost Converter Output

Vout = 0.6 × (1 + R2/R3) = 0.6 × (1 + 1.8M/100k) ≈ 11.4V
After SS34 drop (~0.4V): ≈ 11.0V at RJ45 — within FLARM 8–36V input range.

## Files

- `EasyEDA/` — schematic and PCB design files (EasyEDA Pro JSON + PDF)
- `Docs/` — Gerber, BOM, CPL for JLCPCB ordering
