import { motion } from "framer-motion";
import type { CraneTelemetryState } from "./types";

interface Props {
  telemetry: CraneTelemetryState;
}

export function ControlStrip({ telemetry }: Props) {
  const precision = Math.round(35 + telemetry.loadRatio * 35);
  const accel = Math.round(50 + telemetry.vibration * 400);

  return (
    <motion.div
      className="control-strip glass-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="control-strip__joystick">
        <span className="control-strip__joystick-label">Manual</span>
        <div className="joystick">
          <motion.button
            type="button"
            className="joystick__btn joystick__btn--up"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Up"
          >
            ↑
          </motion.button>
          <motion.button
            type="button"
            className="joystick__btn joystick__btn--left"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Left"
          >
            ←
          </motion.button>
          <motion.button
            type="button"
            className="joystick__btn joystick__btn--center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Pause"
          >
            ⏸
          </motion.button>
          <motion.button
            type="button"
            className="joystick__btn joystick__btn--right"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Right"
          >
            →
          </motion.button>
          <motion.button
            type="button"
            className="joystick__btn joystick__btn--down"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Down"
          >
            ↓
          </motion.button>
        </div>
      </div>

      <div className="control-strip__sliders">
        <SliderControl label="Precision mode" value={precision} />
        <SliderControl label="Trolley accel" value={Math.min(100, accel)} />
      </div>

      <div className="control-strip__actions">
        {["Power", "Stop", "Camera", "Safety", "Lights"].map((label, i) => (
          <motion.button
            key={label}
            type="button"
            className={`control-btn ${label === "Lights" ? "control-btn--active" : ""}`}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(5,81,239,0.25)" }}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <span className="control-btn__icon">{getIcon(label)}</span>
            <span className="control-btn__label">{label}</span>
          </motion.button>
        ))}
      </div>

      <div className="control-strip__load">
        <div className="load-gauge">
          <span className="load-gauge__label">Height</span>
          <div className="load-gauge__bars">
            {[20, 40, 45].map((ft) => (
              <div
                key={ft}
                className={`load-gauge__bar ${telemetry.loadRatio * 45 >= ft - 5 ? "load-gauge__bar--active" : ""}`}
              >
                <span>{ft}ft</span>
              </div>
            ))}
          </div>
        </div>
        <div className="load-stats">
          <div>
            <span className="load-stats__key">Gross</span>
            <span className="load-stats__val">{(telemetry.loadKg / 1000).toFixed(1)} t</span>
          </div>
          <div>
            <span className="load-stats__key">Sway</span>
            <span className="load-stats__val">{(telemetry.vibration * 90).toFixed(1)}°</span>
          </div>
        </div>
        <motion.button
          type="button"
          className="btn btn--detach"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Detach
        </motion.button>
      </div>
    </motion.div>
  );
}

function SliderControl({ label, value }: { label: string; value: number }) {
  return (
    <div className="slider-control">
      <div className="slider-control__head">
        <span className="slider-control__label">{label}</span>
        <span className="slider-control__value">{value}%</span>
      </div>
      <div className="slider-control__track">
        <motion.div
          className="slider-control__fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="slider-control__thumb"
          initial={{ left: 0 }}
          animate={{ left: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function getIcon(label: string): string {
  const icons: Record<string, string> = {
    Power: "⏻",
    Stop: "■",
    Camera: "◉",
    Safety: "⛨",
    Lights: "☀",
  };
  return icons[label] ?? "•";
}
