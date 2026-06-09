"""Monitor a serial port, log to file with timestamps.

Usage: python flarm_monitor.py [PORT] [BAUD]   (defaults: COM11 19200)
"""
import serial
import time
import sys
from datetime import datetime

PORT = sys.argv[1] if len(sys.argv) > 1 else "COM11"
BAUD = int(sys.argv[2]) if len(sys.argv) > 2 else 19200
LOG_FILE = f"{PORT.lower()}_log.txt"
DURATION_HOURS = 6

def main():
    start = time.time()
    end = start + DURATION_HOURS * 3600

    print(f"Monitoring {PORT} @ {BAUD} baud for {DURATION_HOURS}h")
    print(f"Logging to {LOG_FILE}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Press Ctrl+C to stop early.\n")

    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
    except serial.SerialException as e:
        print(f"Error opening {PORT}: {e}")
        sys.exit(1)

    line_count = 0
    byte_count = 0

    try:
        with open(LOG_FILE, "a", encoding="utf-8", errors="replace") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"Session start: {datetime.now().isoformat()}\n")
            f.write(f"Port: {PORT} @ {BAUD} baud\n")
            f.write(f"{'='*60}\n")
            f.flush()

            while time.time() < end:
                try:
                    raw = ser.readline()
                except serial.SerialException as e:
                    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    msg = f"[{ts}] !!! Serial error: {e}\n"
                    f.write(msg)
                    f.flush()
                    print(msg, end="")
                    time.sleep(1)
                    continue

                if raw:
                    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    try:
                        text = raw.decode("ascii", errors="replace").rstrip("\r\n")
                    except Exception:
                        text = repr(raw)
                    line = f"[{ts}] {text}\n"
                    f.write(line)
                    byte_count += len(raw)
                    line_count += 1
                    if line_count % 100 == 0:
                        f.flush()
                        elapsed = (time.time() - start) / 3600
                        print(f"  {line_count} lines, {byte_count} bytes, {elapsed:.1f}h elapsed")

            f.write(f"\n{'='*60}\n")
            f.write(f"Session end (timeout): {datetime.now().isoformat()}\n")
            f.write(f"Lines: {line_count}, Bytes: {byte_count}\n")
            f.write(f"{'='*60}\n")

    except KeyboardInterrupt:
        with open(LOG_FILE, "a") as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"Session end (user stop): {datetime.now().isoformat()}\n")
            f.write(f"Lines: {line_count}, Bytes: {byte_count}\n")
            f.write(f"{'='*60}\n")
    finally:
        ser.close()

    elapsed = (time.time() - start) / 3600
    print(f"\nDone. {line_count} lines, {byte_count} bytes in {elapsed:.1f}h")
    print(f"Log: {LOG_FILE}")

if __name__ == "__main__":
    main()
