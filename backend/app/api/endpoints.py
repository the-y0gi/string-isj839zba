from typing import List, Dict
from fastapi import APIRouter, Query, HTTPException
from app.services.data_loader import data_loader
from app.services.forecast_service import forecast_service
from app.models.schemas import (
    DayAheadResponse, OverallMetricsSummary, DiurnalProfileResponse, HealthResponse
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    df_act, df_fc = data_loader.get_dataframes()
    date_min = df_act["settlementDate"].min() if not df_act.empty and "settlementDate" in df_act else "N/A"
    date_max = df_act["settlementDate"].max() if not df_act.empty and "settlementDate" in df_act else "N/A"
    
    return HealthResponse(
        status="healthy",
        service="UK Wind Power Day-Ahead Trading Platform",
        data_loaded=not df_act.empty and not df_fc.empty,
        total_actual_records=len(df_act),
        total_forecast_records=len(df_fc),
        date_range={"from": str(date_min), "to": str(date_max)}
    )

@router.get("/available-dates", response_model=List[str])
def get_available_dates():
    df_act, _ = data_loader.get_dataframes()
    if df_act.empty or "settlementDate" not in df_act:
        return []
    dates = sorted(df_act["settlementDate"].dropna().unique().tolist())
    return dates

@router.get("/forecasts/day-ahead", response_model=DayAheadResponse)
def get_day_ahead_forecast(
    date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead decision gate closure hour (UTC) on D-1")
):
    try:
        return forecast_service.get_day_ahead(delivery_date=date, cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/metrics/summary", response_model=OverallMetricsSummary)
def get_metrics_summary(
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead decision gate closure hour (UTC)")
):
    try:
        return forecast_service.get_overall_summary(cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/metrics/diurnal-profile", response_model=DiurnalProfileResponse)
def get_diurnal_profile(
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead decision gate closure hour (UTC)")
):
    try:
        return forecast_service.get_diurnal_profile(cutoff_hour=cutoff_hour)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
