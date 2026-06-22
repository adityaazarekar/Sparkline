"""Lightweight mock API for dashboard screenshots when Docker is unavailable."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = datetime(2025, 6, 18, tzinfo=timezone.utc)


def _series(crane_id: str, base: float, spike_day: int) -> list[dict]:
    points = []
    for i in range(96):
        ts = BASE + timedelta(hours=i * 0.75)
        temp = base + (i % 8) * 0.4
        if ts.day == spike_day and 12 <= ts.hour <= 16:
            temp += 12 + (i % 5)
        points.append(
            {
                "id": i + 1,
                "crane_id": crane_id,
                "timestamp": ts.isoformat().replace("+00:00", "Z"),
                "load_kg": 1500 + (i * 17) % 3000,
                "motor_temp_c": round(temp, 2),
                "vibration": round(0.02 + (i % 7) * 0.004, 4),
                "status": "operational",
                "created_at": ts.isoformat().replace("+00:00", "Z"),
            }
        )
    return points


ALL = _series("CR-101", 68, 19) + _series("CR-102", 71, 20) + _series("CR-103", 65, 21)


@app.get("/api/readings/latest")
def latest():
    latest_by_crane = {}
    for row in ALL:
        cid = row["crane_id"]
        if cid not in latest_by_crane or row["timestamp"] > latest_by_crane[cid]["timestamp"]:
            latest_by_crane[cid] = row
    return list(latest_by_crane.values())


@app.get("/api/readings/{crane_id}")
def range_query(crane_id: str, start: str, end: str):
    return [r for r in ALL if r["crane_id"] == crane_id and start <= r["timestamp"] <= end]


@app.get("/api/alerts")
def alerts():
    return [
        {
            "id": 1,
            "crane_id": "CR-101",
            "reading_id": 42,
            "alert_type": "motor_temp_high",
            "message": "ALERT: CR-101 motor temp 83.2°C exceeds threshold",
            "motor_temp_c": 83.2,
            "created_at": "2025-06-19T14:30:00Z",
        },
        {
            "id": 2,
            "crane_id": "CR-102",
            "reading_id": 88,
            "alert_type": "motor_temp_high",
            "message": "ALERT: CR-102 motor temp 86.1°C exceeds threshold",
            "motor_temp_c": 86.1,
            "created_at": "2025-06-20T11:15:00Z",
        },
        {
            "id": 3,
            "crane_id": "CR-101",
            "reading_id": 95,
            "alert_type": "motor_temp_high",
            "message": "ALERT: CR-101 motor temp 85.7°C exceeds threshold",
            "motor_temp_c": 85.7,
            "created_at": "2025-06-19T15:00:00Z",
        },
    ]
