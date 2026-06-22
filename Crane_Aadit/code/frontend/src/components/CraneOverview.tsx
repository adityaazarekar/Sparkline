import type { Reading } from "../api";
import { MOTOR_TEMP_THRESHOLD } from "../api";

interface Props {
  readings: Reading[];
  loading: boolean;
  error: string | null;
  selectedCrane: string;
  onSelect: (id: string) => void;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tempStatus(temp: number): "normal" | "warn" | "critical" {
  if (temp > MOTOR_TEMP_THRESHOLD) return "critical";
  if (temp > MOTOR_TEMP_THRESHOLD - 8) return "warn";
  return "normal";
}

function loadPercent(load: number | null): number {
  if (load == null) return 0;
  return Math.min(100, Math.round((load / 5000) * 100));
}

export function CraneOverview({ readings, loading, error, selectedCrane, onSelect }: Props) {
  if (loading && readings.length === 0) {
    return (
      <div className="metric-grid metric-grid--loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="metric-card metric-card--skeleton" />
        ))}
      </div>
    );
  }

  if (error && readings.length === 0) {
    return <p className="state-error">Failed to load telemetry: {error}</p>;
  }

  if (readings.length === 0) {
    return <p className="state-empty">No readings yet — run seed or POST telemetry.</p>;
  }

  return (
    <div className="metric-grid">
      {readings.map((reading, index) => {
        const hot = reading.motor_temp_c > MOTOR_TEMP_THRESHOLD;
        const status = tempStatus(reading.motor_temp_c);
        const loadPct = loadPercent(reading.load_kg);
        const active = reading.crane_id === selectedCrane;

        return (
          <button
            key={reading.crane_id}
            type="button"
            className={`metric-card metric-card--${status} ${active ? "metric-card--active" : ""}`}
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => onSelect(reading.crane_id)}
          >
            <div className="metric-card__shine" aria-hidden />
            <div className="metric-card__head">
              <span className="metric-card__label">Crane Unit</span>
              <span className={`status-dot status-dot--${hot ? "critical" : "normal"}`} />
            </div>
            <h3 className="metric-card__id">{reading.crane_id}</h3>
            <div className="metric-card__hero">
              <span className="metric-card__value">{reading.motor_temp_c.toFixed(1)}</span>
              <span className="metric-card__unit">°C</span>
            </div>
            <p className="metric-card__status">
              Motor temp · {hot ? "Above threshold" : "Within limits"}
            </p>
            <div className="metric-card__bar">
              <div className="metric-card__bar-fill" style={{ width: `${loadPct}%` }} />
            </div>
            <dl className="metric-card__meta">
              <div>
                <dt className="text-gray-400">Load</dt>
                <dd className="text-gray-200">{reading.load_kg?.toLocaleString() ?? "—"} kg</dd>
              </div>
              <div>
                <dt className="text-gray-400">Vibration</dt>
                <dd className="text-gray-200">{reading.vibration?.toFixed(3) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Mode</dt>
                <dd className="text-gray-200 capitalize">{reading.status}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Updated</dt>
                <dd className="text-gray-200">{formatTime(reading.timestamp)}</dd>
              </div>
            </dl>
            {hot && <span className="metric-card__flag">Alert active</span>}
          </button>
        );
      })}
    </div>
  );
}
