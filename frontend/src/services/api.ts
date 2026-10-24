import type {
  DayAheadResponse,
  OverallMetricsSummary,
  DiurnalProfileResponse,
  HealthResponse
} from '../types/api';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchAvailableDates(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/available-dates`);
  if (!res.ok) throw new Error('Failed to fetch available dates');
  return res.json();
}

export async function fetchDayAheadForecast(
  date: string,
  cutoffHour: number = 11
): Promise<DayAheadResponse> {
  const res = await fetch(`${API_BASE}/forecasts/day-ahead?date=${date}&cutoff_hour=${cutoffHour}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch day-ahead forecast');
  }
  return res.json();
}

export async function fetchMetricsSummary(
  cutoffHour: number = 11
): Promise<OverallMetricsSummary> {
  const res = await fetch(`${API_BASE}/metrics/summary?cutoff_hour=${cutoffHour}`);
  if (!res.ok) throw new Error('Failed to fetch overall metrics');
  return res.json();
}

export async function fetchDiurnalProfile(
  cutoffHour: number = 11
): Promise<DiurnalProfileResponse> {
  const res = await fetch(`${API_BASE}/metrics/diurnal-profile?cutoff_hour=${cutoffHour}`);
  if (!res.ok) throw new Error('Failed to fetch diurnal profile');
  return res.json();
}
