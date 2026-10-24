import pytest
from app.services.forecast_service import forecast_service
from app.services.data_loader import data_loader

def test_data_loaded_successfully():
    df_act, df_fc = data_loader.get_dataframes()
    assert not df_act.empty, "Actuals dataframe should not be empty"
    assert not df_fc.empty, "Forecasts dataframe should not be empty"
    assert len(df_act) == 1488, f"Expected 1488 actual records (31 days * 48 HH), got {len(df_act)}"

def test_no_lookahead_bias():
    matched = forecast_service.get_matched_dataframe_for_month(cutoff_hour=11)
    assert not matched.empty
    violations = matched[matched["forecast_publish_time"] > matched["decision_cutoff"]]
    assert len(violations) == 0, f"Found {len(violations)} lookahead bias violations where forecast was published after decision cutoff!"

def test_day_ahead_settlement_periods():
    res = forecast_service.get_day_ahead(delivery_date="2026-01-15", cutoff_hour=11)
    assert res.delivery_date == "2026-01-15"
    assert len(res.records) == 48, f"Expected 48 settlement periods, got {len(res.records)}"
    assert res.summary.mae_mw >= 0, "MAE must be non-negative"
    assert res.summary.rmse_mw >= res.summary.mae_mw, "RMSE must be >= MAE mathematically"

def test_overall_metrics_consistency():
    metrics = forecast_service.get_overall_summary(cutoff_hour=11)
    assert metrics.total_days == 31, f"Expected 31 unique days in January 2026, got {metrics.total_days}"
    assert metrics.rmse_mw >= metrics.mae_mw, "RMSE must be >= MAE"
    assert metrics.confidence_buffer_95pct_mw >= metrics.confidence_buffer_90pct_mw, "95% buffer must be >= 90% buffer"

def test_diurnal_profile_coverage():
    diurnal = forecast_service.get_diurnal_profile(cutoff_hour=11)
    assert len(diurnal.periods) == 48
    sps = [p.settlement_period for p in diurnal.periods]
    assert sps == list(range(1, 49)), "Settlement periods must cover 1 through 48 sequentially"
