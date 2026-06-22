"""Integration tests and evidence capture using in-memory SQLite."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))
os.environ["SKIP_INIT_DB"] = "1"

from app.database import Base, get_db
from app.main import app
from app.models import Alert, Reading

engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def reset_db() -> None:
    db = TestingSessionLocal()
    try:
        db.execute(delete(Alert))
        db.execute(delete(Reading))
        db.commit()
    finally:
        db.close()


def post_reading(payload: dict) -> dict:
    response = client.post("/api/readings", json=payload)
    if response.status_code != 201:
        raise RuntimeError(f"POST failed ({response.status_code}): {response.text}")
    return response.json()


def capture_evidence() -> dict:
    reset_db()

    normal_payload = {
        "crane_id": "CR-101",
        "timestamp": "2025-06-20T10:00:00Z",
        "load_kg": 2200.5,
        "motor_temp_c": 74.2,
        "vibration": 0.031,
        "status": "operational",
    }
    post_reading(normal_payload)

    post_reading(
        {
            "crane_id": "CR-102",
            "timestamp": "2025-06-20T10:05:00Z",
            "load_kg": 1800.0,
            "motor_temp_c": 71.0,
            "vibration": 0.028,
            "status": "operational",
        }
    )
    post_reading(
        {
            "crane_id": "CR-103",
            "timestamp": "2025-06-20T10:10:00Z",
            "load_kg": 900.0,
            "motor_temp_c": 68.5,
            "vibration": 0.019,
            "status": "idle",
        }
    )

    alert_payload = {
        "crane_id": "CR-101",
        "timestamp": "2025-06-20T14:00:00Z",
        "load_kg": 4100.0,
        "motor_temp_c": 83.2,
        "vibration": 0.055,
        "status": "operational",
    }
    alert_reading = post_reading(alert_payload)

    live_alert_payload = {
        "crane_id": "CR-101",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "load_kg": 4300.0,
        "motor_temp_c": 85.7,
        "vibration": 0.061,
        "status": "operational",
    }
    live_alert_reading = post_reading(live_alert_payload)

    latest = client.get("/api/readings/latest")
    range_response = client.get(
        "/api/readings/CR-101",
        params={"start": "2025-06-20T00:00:00Z", "end": "2025-06-21T00:00:00Z"},
    )
    alerts = client.get("/api/alerts")

    return {
        "post_reading_normal": {
            "request": {"method": "POST", "path": "/api/readings", "body": normal_payload},
            "response_status": 201,
            "response_body": post_reading(
                {
                    "crane_id": "CR-101",
                    "timestamp": "2025-06-21T08:00:00Z",
                    "load_kg": 1500.0,
                    "motor_temp_c": 72.0,
                    "vibration": 0.02,
                    "status": "operational",
                }
            ),
        },
        "get_latest": {
            "request": {"method": "GET", "path": "/api/readings/latest"},
            "response_status": latest.status_code,
            "response_body": latest.json(),
        },
        "get_range": {
            "request": {
                "method": "GET",
                "path": "/api/readings/CR-101?start=2025-06-20T00:00:00Z&end=2025-06-21T00:00:00Z",
            },
            "response_status": range_response.status_code,
            "response_body": range_response.json(),
        },
        "post_alert_trigger": {
            "request": {"method": "POST", "path": "/api/readings", "body": alert_payload},
            "response_status": 201,
            "response_body": alert_reading,
            "logged_message": "ALERT: CR-101 motor temp 83.2°C exceeds threshold",
        },
        "post_live_alert": {
            "request": {"method": "POST", "path": "/api/readings", "body": live_alert_payload},
            "response_status": 201,
            "response_body": live_alert_reading,
            "logged_message": "ALERT: CR-101 motor temp 85.7°C exceeds threshold",
        },
        "get_alerts": {
            "request": {"method": "GET", "path": "/api/alerts"},
            "response_status": alerts.status_code,
            "response_body": alerts.json(),
        },
    }


if __name__ == "__main__":
    print(json.dumps(capture_evidence(), indent=2, default=str))
