export interface Reading {
  id: number;
  crane_id: string;
  timestamp: string;
  load_kg: number | null;
  motor_temp_c: number;
  vibration: number | null;
  status: string;
  created_at: string;
}

export interface Alert {
  id: number;
  crane_id: string;
  reading_id: number | null;
  alert_type: string;
  message: string;
  motor_temp_c: number | null;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function getLatestReadings(): Promise<Reading[]> {
  return fetchJson<Reading[]>("/api/readings/latest");
}

export function getReadingsInRange(
  craneId: string,
  start: string,
  end: string,
): Promise<Reading[]> {
  const params = new URLSearchParams({ start, end });
  return fetchJson<Reading[]>(`/api/readings/${encodeURIComponent(craneId)}?${params}`);
}

export function getAlerts(): Promise<Alert[]> {
  return fetchJson<Alert[]>("/api/alerts");
}

export const MOTOR_TEMP_THRESHOLD = 80;
