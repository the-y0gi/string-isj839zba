export interface SettlementPeriodRecord {
  settlement_period: number;
  start_time: string;
  settlement_date: string;
  actual_mw: number | null;
  forecast_mw: number | null;
  forecast_publish_time: string | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  error_pct: number | null;
  is_overforecast: boolean | null;
}

export interface DailySummary {
  date: string;
  decision_cutoff: string;
  total_periods: number;
  matched_periods: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  wape_pct: number;
  peak_actual_mw: number;
  peak_forecast_mw: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
}

export interface DayAheadResponse {
  delivery_date: string;
  decision_cutoff_time: string;
  cutoff_hour: number;
  summary: DailySummary;
  records: SettlementPeriodRecord[];
}

export interface OverallMetricsSummary {
  total_days: number;
  total_periods: number;
  decision_cutoff_hour: number;
  mae_mw: number;
  rmse_mw: number;
  mean_bias_mw: number;
  wape_pct: number;
  overforecast_ratio_pct: number;
  max_overforecast_mw: number;
  max_underforecast_mw: number;
  confidence_buffer_90pct_mw: number;
  confidence_buffer_95pct_mw: number;
}

export interface DiurnalPeriodMetric {
  settlement_period: number;
  time_label: string;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  mae_mw: number;
  bias_mw: number;
  wape_pct: number;
}

export interface DiurnalProfileResponse {
  decision_cutoff_hour: number;
  periods: DiurnalPeriodMetric[];
}

export interface HealthResponse {
  status: string;
  service: string;
  data_loaded: boolean;
  total_actual_records: number;
  total_forecast_records: number;
  date_range: {
    from: string;
    to: string;
  };
}
