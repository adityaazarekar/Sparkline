import { motion } from "framer-motion";
import type { CraneTelemetryState } from "./types";
import { MOTOR_TEMP_THRESHOLD } from "../../api";

interface Props {
  telemetry: CraneTelemetryState;
}

function formatLoad(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg} kg`;
}

export function TelemetryHUD({ telemetry }: Props) {
  const containerId = `MSKU ${telemetry.craneId.replace("CR-", "")}321-9`;

  return (
    <div className="hud">
      <motion.div
        className="hud-card hud-card--primary"
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hud-card__header">
          <span className="hud-card__eyebrow">Container ID</span>
          <button type="button" className="hud-card__close" aria-label="Close">
            ×
          </button>
        </div>
        <p className="hud-card__hero">{containerId}</p>
        <div className="hud-card__grid">
          <div>
            <span className="hud-card__label">Owner</span>
            <span className="hud-card__value">Sparkline Line</span>
          </div>
          <div>
            <span className="hud-card__label">Location</span>
            <span className="hud-card__value">Block C4 / Stack 7</span>
          </div>
          <div>
            <span className="hud-card__label">Gross load</span>
            <span className="hud-card__value">{formatLoad(telemetry.loadKg)}</span>
          </div>
          <div>
            <span className="hud-card__label">Mode</span>
            <span className="hud-card__value capitalize">{telemetry.status}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="hud-card hud-card--status"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="hud-card__eyebrow">Status</span>
        <div className="hud-status">
          <motion.span
            className={`status-dot status-dot--${telemetry.isHot ? "critical" : "normal"}`}
            animate={{ scale: telemetry.isHot ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: telemetry.isHot ? Infinity : 0, duration: 2 }}
          />
          <span className="hud-status__text">
            {telemetry.isHot ? "Alert" : "Operational"}
          </span>
        </div>
        <div className="hud-status__mode">
          <span className="hud-card__label">Mode</span>
          <span className="hud-status__mode-val capitalize">{telemetry.status}</span>
        </div>
      </motion.div>

      <motion.div
        className="hud-metrics"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <MetricTile
          label="Hoist torque"
          value={`${Math.round(40 + telemetry.loadRatio * 45)}%`}
          status={telemetry.loadRatio > 0.7 ? "warn" : "stable"}
          sub="Status: Stable load"
        />
        <MetricTile
          label="Motor temp"
          value={`${telemetry.motorTemp.toFixed(1)}°C`}
          status={telemetry.isHot ? "critical" : "stable"}
          sub={`Limit ${MOTOR_TEMP_THRESHOLD}°C`}
        />
        <MetricTile
          label="Trolley drive"
          value={`${(2.2 + telemetry.vibration * 30).toFixed(1)} m/s`}
          status="stable"
          sub="Gantry track A"
        />
        <MetricTile
          label="Vibration"
          value={telemetry.vibration.toFixed(3)}
          status={telemetry.vibration > 0.05 ? "warn" : "stable"}
          sub="RMS sensor"
        />
      </motion.div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  status,
  sub,
}: {
  label: string;
  value: string;
  status: "stable" | "warn" | "critical";
  sub: string;
}) {
  return (
    <motion.div
      className={`metric-tile metric-tile--${status}`}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="metric-tile__head">
        <span className="metric-tile__label">{label}</span>
        <span className={`metric-tile__dot metric-tile__dot--${status}`} />
      </div>
      <span className="metric-tile__value">{value}</span>
      <span className="metric-tile__sub">{sub}</span>
    </motion.div>
  );
}
