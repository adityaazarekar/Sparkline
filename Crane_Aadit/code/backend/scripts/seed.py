"""Load readings_seed.json into PostgreSQL via the ingestion path (alerts included)."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, init_db
from app.models import Alert, Reading
from app.services.alerting import maybe_create_motor_temp_alert


def parse_timestamp(value: str) -> datetime:
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value)


def load_seed(db: Session, seed_path: Path) -> tuple[int, int]:
    raw = json.loads(seed_path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Seed file must be a JSON array")

    db.execute(delete(Alert))
    db.execute(delete(Reading))
    db.commit()

    reading_count = 0
    alert_count = 0

    for item in raw:
        reading = Reading(
            crane_id=item["crane_id"],
            timestamp=parse_timestamp(item["timestamp"]),
            load_kg=item.get("load_kg"),
            motor_temp_c=item["motor_temp_c"],
            vibration=item.get("vibration"),
            status=item["status"],
        )
        db.add(reading)
        db.flush()
        reading_count += 1
        if maybe_create_motor_temp_alert(db, reading):
            alert_count += 1

    db.commit()
    return reading_count, alert_count


def main() -> None:
    seed_file = Path(os.getenv("SEED_FILE", Path(__file__).parent.parent / "data" / "readings_seed.json"))
    if not seed_file.exists():
        print(f"Seed file not found: {seed_file}", file=sys.stderr)
        sys.exit(1)

    init_db()
    db = SessionLocal()
    try:
        readings, alerts = load_seed(db, seed_file)
        print(f"Seeded {readings} readings and {alerts} alerts from {seed_file}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
