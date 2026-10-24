from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class SettlementPeriodRecord(BaseModel):
    settlement_period: int = Field(..., ge=1, le=50, description="Settlement Period (1 to 48)")
    start_time: str = Field(..., description="ISO UTC timestamp of the start of the 30-min period")
    settlement_date: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    actual_mw: Optional[float] = Field(None, description="Actual wind generation in MW")
    forecast_mw: Optional[float] = Field(None, description="Day-ahead forecasted wind generation in MW")
    forecast_publish_time: Optional[str] = Field(None, description="Timestamp when the forecast was issued")
    error_mw: Optional[float] = Field(None, description="Error in MW (Forecast - Actual)")
    abs_error_mw: Optional[float] = Field(None, description="Absolute error in MW")
    error_pct: Optional[float] = Field(None, description="Percentage error relative to actual")
    is_overforecast: Optional[bool] = Field(None, description="True if Forecast > Actual (Short risk)")

class DailySummary(BaseModel):
    date: str
    decision_cutoff: str
    total_periods: int
    matched_periods: int
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    wape_pct: float
    peak_actual_mw: float
    peak_forecast_mw: float
    total_actual_mwh: float
    total_forecast_mwh: float

class DayAheadResponse(BaseModel):
    delivery_date: str
    decision_cutoff_time: str
    cutoff_hour: int
    summary: DailySummary
    records: List[SettlementPeriodRecord]

class OverallMetricsSummary(BaseModel):
    total_days: int
    total_periods: int
    decision_cutoff_hour: int
    mae_mw: float
    rmse_mw: float
    mean_bias_mw: float
    wape_pct: float
    overforecast_ratio_pct: float
    max_overforecast_mw: float
    max_underforecast_mw: float
    confidence_buffer_90pct_mw: float
    confidence_buffer_95pct_mw: float

class DiurnalPeriodMetric(BaseModel):
    settlement_period: int
    time_label: str
    avg_actual_mw: float
    avg_forecast_mw: float
    mae_mw: float
    bias_mw: float
    wape_pct: float

class DiurnalProfileResponse(BaseModel):
    decision_cutoff_hour: int
    periods: List[DiurnalPeriodMetric]

class HealthResponse(BaseModel):
    status: str
    service: str
    data_loaded: bool
    total_actual_records: int
    total_forecast_records: int
    date_range: Dict[str, str]
