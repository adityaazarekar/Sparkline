# Sparkline Crane Telemetry — Take-Home Submission

Industrial crane monitoring dashboard: FastAPI backend, PostgreSQL storage, React frontend.

## Quick start (Docker — under 5 minutes)

**Prerequisites:** Docker Desktop running.

```bash
cd code
docker compose up --build
```

| Service   | URL |
|-----------|-----|
| Dashboard | http://localhost:5173 |
| API docs  | http://localhost:8000/docs |
| Health    | http://localhost:8000/health |

The `seed` service loads `code/backend/data/readings_seed.json` automatically (~864 readings, 3 cranes, 3 days).

Stop:

```bash
docker compose down
```

## Manual setup (without Docker)

**Terminal 1 — PostgreSQL**

Ensure PostgreSQL 16+ is running with:

- Database: `sparkline`
- User / password: `sparkline`

**Terminal 2 — API**

```bash
cd code/backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
set DATABASE_URL=postgresql+psycopg2://sparkline:sparkline@localhost:5432/sparkline
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Seed**

```bash
cd code/backend
.venv\Scripts\activate
set DATABASE_URL=postgresql+psycopg2://sparkline:sparkline@localhost:5432/sparkline
python scripts/seed.py
```

**Terminal 4 — Frontend**

```bash
cd code/frontend
npm install
set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/readings` | Ingest a telemetry reading (validates payload, triggers alerts) |
| GET | `/api/readings/latest` | Latest reading per crane |
| GET | `/api/readings/{crane_id}?start=&end=` | Readings in ISO8601 time range |
| GET | `/api/alerts` | All stored alerts (newest first) |

## Design decisions

### Architecture

Three-tier layout: React dashboard → FastAPI REST API → PostgreSQL. The seed loader bulk-inserts historical data through the same alert path used by live ingestion, so demo alerts match production behaviour.

### Database

Two tables:

- **`readings`** — telemetry time series, unique on `(crane_id, timestamp)` to prevent duplicates
- **`alerts`** — denormalized alert messages linked to readings via `reading_id`

Index on `(crane_id, timestamp)` supports latest-per-crane and range queries. Alerts indexed by `created_at` for the dashboard list.

### Alerting

Alerts are evaluated **synchronously on ingest**: if `motor_temp_c > 80`, the API writes an `alerts` row and logs:

```
ALERT: CR-101 motor temp 83.2°C exceeds threshold
```

Threshold is configurable via `MOTOR_TEMP_THRESHOLD_C` (default `80`). One alert per hot reading — no deduplication, per assignment spec.

### Trade-offs

| Choice | Why |
|--------|-----|
| 5s polling | Meets auto-refresh requirement; simpler than WebSockets for a 6h build |
| Sync alerting | Immediate log output for reviewers; no background worker needed |
| SQLAlchemy ORM | Readable models; efficient grouped query for latest readings |
| Docker Compose | One command for DB + API + seed + UI |

## Production email alerting

For real deployments:

1. Keep synchronous alert **persistence** in the API (fast, reliable).
2. Add an `alert_outbox` table written in the same transaction as `alerts`.
3. Run a worker (Celery, ARQ, or a cron job) that reads unsent outbox rows.
4. Send via SendGrid / AWS SES with:
   - **Rate limiting** — max N emails per crane per hour
   - **Deduplication** — suppress repeat emails within a cooldown window
   - **Retry + dead letter** — failed sends stay in outbox until resolved
5. Include deep links back to the dashboard alert detail page.

## Future improvements

- WebSocket or SSE for live telemetry without polling
- Alert acknowledgement workflow and operator notes
- Grafana / Prometheus metrics export
- Role-based auth for operators vs admins
- Partition `readings` by month for long-term retention
- Integration tests in CI with Testcontainers PostgreSQL

## Tools and resources

- **FastAPI** — API framework and OpenAPI docs
- **SQLAlchemy 2** — ORM and query builder
- **React + Vite + Recharts** — dashboard and temperature chart
- **Docker Compose** — local orchestration
- **Cursor** — development assistant

**Rejected approach:** WebSockets for live updates. Polling every 5 seconds is sufficient for crane telemetry at this scale, avoids connection-state complexity, and matches the assignment wording ("polling every few seconds is fine").

## Assumptions

- Seed field names: `crane_id`, `timestamp`, `load_kg`, `motor_temp_c`, `vibration`, `status`
- Timestamps are ISO8601 UTC (`Z` suffix supported)
- Replace `Aadit` in folder/ZIP names with your full legal name before submission

## Live URL

Not deployed for this submission. Local Docker setup above is the primary evaluation path.
