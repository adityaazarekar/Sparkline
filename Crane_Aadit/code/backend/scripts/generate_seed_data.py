"""Generate readings_seed.json with ~3 days of telemetry for 3 cranes."""

from __future__ import annotations

import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

CRANES = ["CR-101", "CR-102", "CR-103"]
INTERVAL_MINUTES = 15
DAYS = 3
OUTPUT = Path(__file__).resolve().parent.parent / "data" / "readings_seed.json"


def generate() -> list[dict]:
    random.seed(42)
    start = datetime(2025, 6, 18, 0, 0, 0, tzinfo=timezone.utc)
    end = start + timedelta(days=DAYS)
    readings: list[dict] = []

    for crane_id in CRANES:
        ts = start
        base_temp = {"CR-101": 68.0, "CR-102": 72.0, "CR-103": 65.0}[crane_id]
        while ts < end:
            hour = ts.hour
            load = round(random.uniform(800, 4500), 2)
            temp_drift = random.uniform(-3, 3)
            if crane_id == "CR-101" and ts.day == 19 and 14 <= hour <= 16:
                temp_drift += random.uniform(8, 18)
            if crane_id == "CR-102" and ts.day == 20 and 10 <= hour <= 12:
                temp_drift += random.uniform(6, 14)
            motor_temp = round(base_temp + temp_drift + (load / 500), 2)
            vibration = round(random.uniform(0.01, 0.08), 4)
            status = "operational" if load > 500 else "idle"

            readings.append(
                {
                    "crane_id": crane_id,
                    "timestamp": ts.isoformat().replace("+00:00", "Z"),
                    "load_kg": load,
                    "motor_temp_c": motor_temp,
                    "vibration": vibration,
                    "status": status,
                }
            )
            ts += timedelta(minutes=INTERVAL_MINUTES)

    readings.sort(key=lambda r: (r["timestamp"], r["crane_id"]))
    return readings


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    data = generate()
    OUTPUT.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {len(data)} readings to {OUTPUT}")
