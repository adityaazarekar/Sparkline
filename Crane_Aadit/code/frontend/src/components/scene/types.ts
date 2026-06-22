import type { Reading } from "../../api";
import { MOTOR_TEMP_THRESHOLD } from "../../api";

export interface CraneTelemetryState {
  motorTemp: number;
  loadKg: number;
  vibration: number;
  status: string;
  craneId: string;
  isHot: boolean;
  loadRatio: number;
  tempRatio: number;
}

export function mapReadingToTelemetry(reading: Reading | undefined): CraneTelemetryState {
  const motorTemp = reading?.motor_temp_c ?? 65;
  const loadKg = reading?.load_kg ?? 0;
  const vibration = reading?.vibration ?? 0.02;
  const status = reading?.status ?? "idle";
  const craneId = reading?.crane_id ?? "CR-101";

  return {
    motorTemp,
    loadKg,
    vibration,
    status,
    craneId,
    isHot: motorTemp > MOTOR_TEMP_THRESHOLD,
    loadRatio: Math.min(1, loadKg / 5000),
    tempRatio: Math.min(1, motorTemp / MOTOR_TEMP_THRESHOLD),
  };
}

export function tempToColor(ratio: number): string {
  if (ratio < 0.6) return "#53ff59";
  if (ratio < 0.85) return "#eeff53";
  return "#ff6039";
}
