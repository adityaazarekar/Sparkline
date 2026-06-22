# API Evidence

Captured from running `python scripts/capture_evidence.py` (FastAPI TestClient against the application code).  
When Docker is running, reproduce with the `curl` commands below against `http://localhost:8000`.

---

## POST /api/readings — ingest reading

**Request**

```bash
curl -s -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "crane_id": "CR-101",
    "timestamp": "2025-06-20T10:00:00Z",
    "load_kg": 2200.5,
    "motor_temp_c": 74.2,
    "vibration": 0.031,
    "status": "operational"
  }'
```

**Response (201 Created)**

```json
{
  "id": 1,
  "crane_id": "CR-101",
  "timestamp": "2025-06-20T10:00:00Z",
  "load_kg": 2200.5,
  "motor_temp_c": 74.2,
  "vibration": 0.031,
  "status": "operational",
  "created_at": "2026-06-21T10:00:56Z"
}
```

---

## GET /api/readings/latest — latest per crane

**Request**

```bash
curl -s http://localhost:8000/api/readings/latest
```

**Response (200 OK)** — one row per crane (3 cranes after seed):

```json
[
  {
    "id": 5,
    "crane_id": "CR-101",
    "timestamp": "2026-06-21T10:00:56.573347Z",
    "load_kg": 4300.0,
    "motor_temp_c": 85.7,
    "vibration": 0.061,
    "status": "operational",
    "created_at": "2026-06-21T10:00:56Z"
  },
  {
    "id": 2,
    "crane_id": "CR-102",
    "timestamp": "2025-06-20T10:05:00Z",
    "load_kg": 1800.0,
    "motor_temp_c": 71.0,
    "vibration": 0.028,
    "status": "operational",
    "created_at": "2026-06-21T10:00:56Z"
  },
  {
    "id": 3,
    "crane_id": "CR-103",
    "timestamp": "2025-06-20T10:10:00Z",
    "load_kg": 900.0,
    "motor_temp_c": 68.5,
    "vibration": 0.019,
    "status": "idle",
    "created_at": "2026-06-21T10:00:56Z"
  }
]
```

---

## GET /api/readings/{crane_id} — time range

**Request**

```bash
curl -s "http://localhost:8000/api/readings/CR-101?start=2025-06-20T00:00:00Z&end=2025-06-21T00:00:00Z"
```

**Response (200 OK)**

```json
[
  {
    "id": 1,
    "crane_id": "CR-101",
    "timestamp": "2025-06-20T10:00:00Z",
    "load_kg": 2200.5,
    "motor_temp_c": 74.2,
    "vibration": 0.031,
    "status": "operational",
    "created_at": "2026-06-21T10:00:56Z"
  },
  {
    "id": 4,
    "crane_id": "CR-101",
    "timestamp": "2025-06-20T14:00:00Z",
    "load_kg": 4100.0,
    "motor_temp_c": 83.2,
    "vibration": 0.055,
    "status": "operational",
    "created_at": "2026-06-21T10:00:56Z"
  }
]
```

---

## Alert trigger — POST reading with motor_temp_c > 80

**Request**

```bash
curl -s -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "crane_id": "CR-101",
    "timestamp": "2025-06-20T14:00:00Z",
    "load_kg": 4100.0,
    "motor_temp_c": 83.2,
    "vibration": 0.055,
    "status": "operational"
  }'
```

**Response (201 Created)**

```json
{
  "id": 4,
  "crane_id": "CR-101",
  "timestamp": "2025-06-20T14:00:00Z",
  "load_kg": 4100.0,
  "motor_temp_c": 83.2,
  "vibration": 0.055,
  "status": "operational",
  "created_at": "2026-06-21T10:00:56Z"
}
```

**Logged message (API stdout)**

```
WARNING app.services.alerting: ALERT: CR-101 motor temp 83.2°C exceeds threshold
```

---

## GET /api/alerts — stored alerts

**Request**

```bash
curl -s http://localhost:8000/api/alerts
```

**Response (200 OK)**

```json
[
  {
    "id": 2,
    "crane_id": "CR-101",
    "reading_id": 5,
    "alert_type": "motor_temp_high",
    "message": "ALERT: CR-101 motor temp 85.7°C exceeds threshold",
    "motor_temp_c": 85.7,
    "created_at": "2026-06-21T10:00:56Z"
  },
  {
    "id": 1,
    "crane_id": "CR-101",
    "reading_id": 4,
    "alert_type": "motor_temp_high",
    "message": "ALERT: CR-101 motor temp 83.2°C exceeds threshold",
    "motor_temp_c": 83.2,
    "created_at": "2026-06-21T10:00:56Z"
  }
]
```

---

## How alerts were triggered

1. POST a reading with `motor_temp_c: 83.2` (see above).
2. API persists the reading, detects `83.2 > 80`, inserts an `alerts` row, and logs the WARNING line.
3. After running `python scripts/seed.py`, seed data includes additional hot readings for CR-101 and CR-102 during simulated peak-load windows.

Regenerate this evidence after Docker is up:

```bash
cd code
docker compose up --build -d
curl http://localhost:8000/api/readings/latest
curl http://localhost:8000/api/alerts
```
