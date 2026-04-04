"""Send a FLARM version query on COM11 to check if it responds."""
import serial
import time

PORT = "COM11"
BAUD = 19200

def nmea_checksum(sentence):
    """Calculate NMEA checksum for string between $ and *."""
    cs = 0
    for c in sentence:
        cs ^= ord(c)
    return f"{cs:02X}"

def send_nmea(ser, body):
    cs = nmea_checksum(body)
    msg = f"${body}*{cs}\r\n"
    ser.write(msg.encode("ascii"))
    print(f"TX: {msg.strip()}")

ser = serial.Serial(PORT, BAUD, timeout=2)
time.sleep(0.1)

# Flush any stale data
ser.reset_input_buffer()

# Try a few common FLARM queries
queries = [
    "PFLAV,R",      # Version request
    "PFLAC,R,DEVTYPE",  # Device type
    "PFLAC,R,ID",   # Device ID
]

for q in queries:
    send_nmea(ser, q)
    time.sleep(0.5)

    # Read responses for up to 2 seconds
    deadline = time.time() + 2
    while time.time() < deadline:
        line = ser.readline()
        if line:
            print(f"RX: {line.decode('ascii', errors='replace').strip()}")
        else:
            break

print("\nDone. Check com11_log.txt for any data captured by the monitor.")
ser.close()
