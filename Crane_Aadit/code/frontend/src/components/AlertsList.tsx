import type { Alert } from "../api";

interface Props {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertsList({ alerts, loading, error }: Props) {
  if (loading && alerts.length === 0) {
    return (
      <div className="alert-feed">
        {[0, 1, 2].map((i) => (
          <div key={i} className="alert-card alert-card--skeleton" />
        ))}
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return <p className="state-error">Failed to load alerts: {error}</p>;
  }

  if (alerts.length === 0) {
    return <p className="state-empty">No alerts triggered. System nominal.</p>;
  }

  return (
    <div className="alert-feed">
      {alerts.slice(0, 12).map((alert, index) => (
        <article
          key={alert.id}
          className="alert-card"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="alert-card__glow" aria-hidden />
          <div className="alert-card__top">
            <span className="status-dot status-dot--critical pulse" />
            <span className="alert-card__type">{alert.alert_type.replace(/_/g, " ")}</span>
            <time className="alert-card__time">{formatTimestamp(alert.created_at)}</time>
          </div>
          <p className="alert-card__message">{alert.message}</p>
          <div className="alert-card__footer">
            <span className="alert-card__crane">{alert.crane_id}</span>
            {alert.motor_temp_c != null && (
              <span className="alert-card__temp">{alert.motor_temp_c.toFixed(1)} °C</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
