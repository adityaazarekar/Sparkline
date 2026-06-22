import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  getAlerts,
  getLatestReadings,
  getReadingsInRange,
  MOTOR_TEMP_THRESHOLD,
  type Reading,
} from "./api";
import { AlertsList } from "./components/AlertsList";
import { CraneOverview } from "./components/CraneOverview";
import { CraneSelector } from "./components/CraneSelector";
import { TemperatureChart } from "./components/TemperatureChart";
import { ControlStrip } from "./components/scene/ControlStrip";
import { CraneViewport } from "./components/scene/CraneViewport";
import { TelemetryHUD } from "./components/scene/TelemetryHUD";
import { mapReadingToTelemetry } from "./components/scene/types";
import { usePolling } from "./hooks/usePolling";
import "./App.css";

const POLL_MS = 5000;
const DEFAULT_START = "2025-06-18T00:00:00Z";
const DEFAULT_END = "2025-06-22T00:00:00Z";

function App() {
  const latestFetcher = useCallback(() => getLatestReadings(), []);
  const alertsFetcher = useCallback(() => getAlerts(), []);

  const latest = usePolling(latestFetcher, POLL_MS);
  const alerts = usePolling(alertsFetcher, POLL_MS);

  const craneIds = useMemo(
    () => (latest.data ?? []).map((r) => r.crane_id).sort(),
    [latest.data],
  );

  const [selectedCrane, setSelectedCrane] = useState("");
  const [chartReadings, setChartReadings] = useState<Reading[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCrane && craneIds.length > 0) {
      setSelectedCrane(craneIds[0]);
    }
  }, [craneIds, selectedCrane]);

  const loadChart = useCallback(async () => {
    if (!selectedCrane) return;
    setChartLoading(true);
    try {
      const data = await getReadingsInRange(selectedCrane, DEFAULT_START, DEFAULT_END);
      setChartReadings(data);
      setChartError(null);
    } catch (err) {
      setChartError(err instanceof Error ? err.message : "Failed to load chart");
    } finally {
      setChartLoading(false);
    }
  }, [selectedCrane]);

  useEffect(() => {
    void loadChart();
    const id = window.setInterval(() => void loadChart(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadChart]);

  const lastUpdated = latest.lastUpdated ?? alerts.lastUpdated;
  const alertCount = alerts.data?.length ?? 0;
  const selectedReading = latest.data?.find((r) => r.crane_id === selectedCrane);
  const telemetry = mapReadingToTelemetry(selectedReading);
  const systemOk = !selectedReading || selectedReading.motor_temp_c <= MOTOR_TEMP_THRESHOLD;

  return (
    <div className="shell">
      <div className="shell__bg" aria-hidden />
      <div className="shell__grain" aria-hidden />

      <motion.header
        className="topbar"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="topbar__brand">
          <span className="topbar__logo">Sparkline</span>
          <span className="topbar__divider" />
          <span className="topbar__site">Yard Telemetry</span>
        </div>
        <nav className="topbar__nav" aria-label="Dashboard sections">
          <motion.span
            className="topbar__nav-item topbar__nav-item--active"
            layoutId="nav-indicator"
          >
            Live
          </motion.span>
          <span className="topbar__nav-item">History</span>
          <span className="topbar__nav-item">Alerts</span>
        </nav>
        <div className="topbar__meta">
          <span className="topbar__pill">
            <span className={`status-dot status-dot--${systemOk ? "normal" : "critical"}`} />
            Safety lock · {systemOk ? "Enabled" : "Alert"}
          </span>
          <span className="topbar__pill">Access · Level 2 Operator</span>
        </div>
        <div className="topbar__actions">
          {lastUpdated && (
            <span className="topbar__sync">
              Synced {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            type="button"
            className="btn btn--ghost"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className={`status-dot status-dot--${systemOk ? "normal" : "critical"} ${!systemOk ? "pulse" : ""}`} />
            {systemOk ? "Nominal" : "Alert"}
          </motion.button>
          <motion.button
            type="button"
            className="btn btn--primary"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="btn__shimmer" aria-hidden />
            Live · {POLL_MS / 1000}s
          </motion.button>
        </div>
      </motion.header>

      <div className="command-center">
        <motion.aside
          className="sidebar glass-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="section-eyebrow">Yard C · Block C1–C10</span>
          <div className="status-hero">
            <motion.span
              className={`status-dot status-dot--${systemOk ? "normal" : "critical"} pulse-slow`}
              animate={{ boxShadow: systemOk
                ? ["0 0 12px rgba(83,255,89,0.6)", "0 0 20px rgba(83,255,89,0.9)", "0 0 12px rgba(83,255,89,0.6)"]
                : ["0 0 12px rgba(255,96,57,0.6)", "0 0 24px rgba(255,96,57,1)", "0 0 12px rgba(255,96,57,0.6)"]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <div>
              <p className="status-hero__label">Status</p>
              <p className="status-hero__value">{systemOk ? "Operational" : "Degraded"}</p>
            </div>
          </div>
          <ul className="sidebar-stats">
            <li>
              <span className="sidebar-stats__key">Mode</span>
              <span className="sidebar-stats__val capitalize">{telemetry.status}</span>
            </li>
            <li>
              <span className="sidebar-stats__key">Wind speed</span>
              <span className="sidebar-stats__val">8.9 m/s (Ok)</span>
            </li>
            <li>
              <span className="sidebar-stats__key">Active units</span>
              <span className="sidebar-stats__val">{craneIds.length || "—"}</span>
            </li>
            <li>
              <span className="sidebar-stats__key">Open alerts</span>
              <span className="sidebar-stats__val sidebar-stats__val--warn">{alertCount}</span>
            </li>
            <li>
              <span className="sidebar-stats__key">Temp limit</span>
              <span className="sidebar-stats__val">{MOTOR_TEMP_THRESHOLD} °C</span>
            </li>
            <li>
              <span className="sidebar-stats__key">Last maintenance</span>
              <span className="sidebar-stats__val">142 h ago</span>
            </li>
          </ul>
          <CraneSelector
            craneIds={craneIds}
            selected={selectedCrane}
            onChange={setSelectedCrane}
            disabled={craneIds.length === 0}
          />
        </motion.aside>

        <section className="hero-stage">
          <div className="hero-stage__viewport">
            <CraneViewport telemetry={telemetry} />
            <TelemetryHUD telemetry={telemetry} />
          </div>
          <ControlStrip telemetry={telemetry} />
        </section>
      </div>

      <div className="dashboard dashboard--lower">
        <main className="main-stage">
          <section className="stage-section">
            <div className="stage-section__head">
              <div>
                <span className="section-eyebrow">Fleet overview</span>
                <h1 className="stage-title">Crane telemetry</h1>
              </div>
              <p className="stage-section__hint">Select a unit to inspect trends</p>
            </div>
            <CraneOverview
              readings={latest.data ?? []}
              loading={latest.loading}
              error={latest.error}
              selectedCrane={selectedCrane}
              onSelect={setSelectedCrane}
            />
          </section>

          <section className="stage-section glass-panel glass-panel--tilt">
            <TemperatureChart
              readings={chartReadings}
              craneId={selectedCrane || "—"}
              loading={chartLoading}
              error={chartError}
            />
          </section>

          <section className="stage-section">
            <div className="stage-section__head">
              <div>
                <span className="section-eyebrow">Threshold events</span>
                <h2 className="stage-title stage-title--sm">Alert feed</h2>
              </div>
              <span className="count-badge">{alertCount}</span>
            </div>
            <AlertsList
              alerts={alerts.data ?? []}
              loading={alerts.loading}
              error={alerts.error}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
