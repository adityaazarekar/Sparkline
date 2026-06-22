import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Reading } from "../api";
import { MOTOR_TEMP_THRESHOLD } from "../api";

interface Props {
  readings: Reading[];
  craneId: string;
  loading: boolean;
  error: string | null;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const temp = payload[0].value;
  const over = temp > MOTOR_TEMP_THRESHOLD;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__time">{label}</span>
      <span className={`chart-tooltip__val ${over ? "chart-tooltip__val--hot" : ""}`}>
        {temp.toFixed(1)} °C
      </span>
    </div>
  );
}

export function TemperatureChart({ readings, craneId, loading, error }: Props) {
  const chartData = readings.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    motor_temp_c: reading.motor_temp_c,
  }));

  return (
    <div className="chart-panel">
      <div className="chart-panel__header">
        <div>
          <span className="section-eyebrow">Historical telemetry</span>
          <h2 className="chart-panel__title">
            Motor temperature · <em>{craneId}</em>
          </h2>
        </div>
        <div className="chart-panel__legend">
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--live" />
            Live trend
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--limit" />
            Limit {MOTOR_TEMP_THRESHOLD}°C
          </span>
        </div>
      </div>

      {loading && chartData.length === 0 && (
        <div className="chart-panel__skeleton">
          <div className="chart-skeleton-line" />
        </div>
      )}
      {error && chartData.length === 0 && <p className="state-error">{error}</p>}
      {!loading && chartData.length === 0 && (
        <p className="state-empty">No readings in the selected time range.</p>
      )}

      {chartData.length > 0 && (
        <div className="chart-panel__canvas">
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0551ef" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#0551ef" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="time"
                minTickGap={40}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(5,81,239,0.3)", strokeWidth: 1 }} />
              <ReferenceLine
                y={MOTOR_TEMP_THRESHOLD}
                stroke="#ff6039"
                strokeDasharray="4 6"
                strokeOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="motor_temp_c"
                stroke="#0551ef"
                strokeWidth={2.5}
                fill="url(#tempGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#eeff53", stroke: "#0551ef", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
