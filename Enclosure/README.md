# Enclosure

3D-printable case for the FLARM USB Updater (REV B).

## Files
- **`box.*`, `lid.*`** — the two printable parts. `.step`/`.3mf` are editable
  source (open in FreeCAD, Fusion 360, etc.); `.stl` is the print-ready mesh.
- **`enclosure-assembly.step`** — board-in-box fit **reference only, do not
  print**. Shows how the REV B PCB sits inside the case (USB-C and RJ45 cutout
  alignment); use it if you respin the board or modify the case.

> Slicers Bambu Studio / OrcaSlicer / PrusaSlicer also import the `.step`/`.3mf`
> directly, so you usually don't need the STL.

## Printing
- **Material:** PLA is fine for normal bench/hangar use — the board barely makes
  heat (~2.5 W max off USB). **Use PETG or ASA if a unit might be left in a hot
  cockpit or car** (PLA softens ~50–60 °C; a sun-baked cockpit exceeds that).
- **Suggested settings:** ~0.2 mm layers, 3 perimeters, 15–20 % infill. No
  supports needed if the connector openings face up; otherwise minimal supports
  at the USB-C / RJ45 cutouts.

## Fit
Designed around the REV B PCB outline with openings for the **USB-C (J1)** and
**RJ45 (RJ1)** connectors and a window for the LEDs. If you respin the board,
re-check the cutout positions against the new layout before printing.
