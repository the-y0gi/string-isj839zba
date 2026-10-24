from datetime import datetime, timedelta
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from app.services.data_loader import data_loader
from app.models.schemas import (
    SettlementPeriodRecord, DailySummary, DayAheadResponse,
    OverallMetricsSummary, DiurnalPeriodMetric, DiurnalProfileResponse
)

class ForecastService:
    def __init__(self):
        self.loader = data_loader
        self._matched_cache: Dict[int, pd.DataFrame] = {}

    def clear_cache(self) -> None:
        self._matched_cache.clear()

    def get_matched_dataframe_for_month(self, cutoff_hour: int = 11) -> pd.DataFrame:
        if cutoff_hour in self._matched_cache:
            return self._matched_cache[cutoff_hour]

        df_act, df_fc = self.loader.get_dataframes()
        if df_act.empty or df_fc.empty:
            return pd.DataFrame()

        df_act_copy = df_act.copy()
        df_act_copy["delivery_date"] = df_act_copy["startTime"].dt.strftime("%Y-%m-%d")

        matched_rows = []
        unique_dates = df_act_copy["delivery_date"].unique()

        for d_str in unique_dates:
            target_date = datetime.strptime(d_str, "%Y-%m-%d").date()
            decision_cutoff = datetime(
                target_date.year, target_date.month, target_date.day,
                cutoff_hour, 0, 0
            ) - timedelta(days=1)
            cutoff_ts = pd.Timestamp(decision_cutoff, tz="UTC")

            day_act = df_act_copy[df_act_copy["delivery_date"] == d_str]
            valid_fc = df_fc[df_fc["publishTime"] <= cutoff_ts]
            latest_fc = valid_fc.sort_values("publishTime").groupby("startTime").last().reset_index()

            merged = pd.merge(
                day_act[["startTime", "settlementDate", "settlementPeriod", "generation"]],
                latest_fc[["startTime", "publishTime", "generation"]],
                on="startTime",
                how="left",
                suffixes=("_actual", "_forecast")
            ).sort_values("startTime").reset_index(drop=True)

            merged["generation_forecast"] = merged["generation_forecast"].interpolate(method="linear").ffill().bfill()
            merged["publishTime"] = merged["publishTime"].ffill().bfill()
            merged["delivery_date"] = d_str
            merged["decision_cutoff"] = cutoff_ts
            matched_rows.append(merged)

        if not matched_rows:
            return pd.DataFrame()

        full_df = pd.concat(matched_rows, ignore_index=True)
        full_df = full_df.rename(
            columns={
                "generation_actual": "actual_mw",
                "generation_forecast": "forecast_mw",
                "publishTime": "forecast_publish_time"
            }
        )

        full_df["error_mw"] = full_df["forecast_mw"] - full_df["actual_mw"]
        full_df["abs_error_mw"] = full_df["error_mw"].abs()
        full_df["sq_error_mw"] = full_df["error_mw"] ** 2
        full_df["error_pct"] = np.where(
            full_df["actual_mw"] > 0,
            (full_df["error_mw"] / full_df["actual_mw"]) * 100.0,
            0.0
        )
        self._matched_cache[cutoff_hour] = full_df
        return full_df

    def get_day_ahead(self, delivery_date: str, cutoff_hour: int = 11) -> DayAheadResponse:
        all_matched = self.get_matched_dataframe_for_month(cutoff_hour=cutoff_hour)
        if all_matched.empty:
            raise ValueError("No data available. Check dataset files.")

        day_data = all_matched[all_matched["delivery_date"] == delivery_date].sort_values("settlementPeriod")
        if day_data.empty:
            first_date = all_matched["delivery_date"].iloc[0]
            day_data = all_matched[all_matched["delivery_date"] == first_date].sort_values("settlementPeriod")
            delivery_date = first_date

        target_dt = datetime.strptime(delivery_date, "%Y-%m-%d")
        cutoff_dt = target_dt - timedelta(days=1)
        cutoff_str = f"{cutoff_dt.strftime('%Y-%m-%d')} {cutoff_hour:02d}:00 UTC"

        records: List[SettlementPeriodRecord] = []
        for _, row in day_data.iterrows():
            act = float(row["actual_mw"]) if pd.notnull(row["actual_mw"]) else None
            fc = float(row["forecast_mw"]) if pd.notnull(row["forecast_mw"]) else None
            err = float(row["error_mw"]) if pd.notnull(row["error_mw"]) else None
            abs_err = float(row["abs_error_mw"]) if pd.notnull(row["abs_error_mw"]) else None
            err_pct = float(row["error_pct"]) if pd.notnull(row["error_pct"]) else None
            pub_time = row["forecast_publish_time"].strftime("%Y-%m-%dT%H:%M:%SZ") if pd.notnull(row["forecast_publish_time"]) else None

            records.append(
                SettlementPeriodRecord(
                    settlement_period=int(row["settlementPeriod"]),
                    start_time=row["startTime"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    settlement_date=row["delivery_date"],
                    actual_mw=round(act, 1) if act is not None else None,
                    forecast_mw=round(fc, 1) if fc is not None else None,
                    forecast_publish_time=pub_time,
                    error_mw=round(err, 1) if err is not None else None,
                    abs_error_mw=round(abs_err, 1) if abs_err is not None else None,
                    error_pct=round(err_pct, 2) if err_pct is not None else None,
                    is_overforecast=(err > 0) if err is not None else None
                )
            )

        valid_pairs = day_data.dropna(subset=["actual_mw", "forecast_mw"])
        mae = float(valid_pairs["abs_error_mw"].mean()) if not valid_pairs.empty else 0.0
        rmse = float(np.sqrt(valid_pairs["sq_error_mw"].mean())) if not valid_pairs.empty else 0.0
        bias = float(valid_pairs["error_mw"].mean()) if not valid_pairs.empty else 0.0
        sum_act = float(valid_pairs["actual_mw"].sum())
        sum_abs_err = float(valid_pairs["abs_error_mw"].sum())
        wape = (sum_abs_err / sum_act * 100.0) if sum_act > 0 else 0.0

        peak_act = float(day_data["actual_mw"].max()) if not day_data.empty else 0.0
        peak_fc = float(day_data["forecast_mw"].max()) if not day_data.empty else 0.0
        total_act_mwh = float(day_data["actual_mw"].sum() * 0.5)
        total_fc_mwh = float(day_data["forecast_mw"].sum() * 0.5)

        summary = DailySummary(
            date=delivery_date,
            decision_cutoff=cutoff_str,
            total_periods=len(day_data),
            matched_periods=len(valid_pairs),
            mae_mw=round(mae, 1),
            rmse_mw=round(rmse, 1),
            bias_mw=round(bias, 1),
            wape_pct=round(wape, 2),
            peak_actual_mw=round(peak_act, 1),
            peak_forecast_mw=round(peak_fc, 1),
            total_actual_mwh=round(total_act_mwh, 1),
            total_forecast_mwh=round(total_fc_mwh, 1)
        )

        return DayAheadResponse(
            delivery_date=delivery_date,
            decision_cutoff_time=cutoff_str,
            cutoff_hour=cutoff_hour,
            summary=summary,
            records=records
        )

    def get_overall_summary(self, cutoff_hour: int = 11) -> OverallMetricsSummary:
        all_matched = self.get_matched_dataframe_for_month(cutoff_hour=cutoff_hour)
        valid = all_matched.dropna(subset=["actual_mw", "forecast_mw"])
        if valid.empty:
            raise ValueError("No matched records found.")

        mae = float(valid["abs_error_mw"].mean())
        rmse = float(np.sqrt(valid["sq_error_mw"].mean()))
        mean_bias = float(valid["error_mw"].mean())
        sum_act = float(valid["actual_mw"].sum())
        sum_abs_err = float(valid["abs_error_mw"].sum())
        wape = (sum_abs_err / sum_act * 100.0) if sum_act > 0 else 0.0

        overforecast_count = (valid["error_mw"] > 0).sum()
        overforecast_ratio = (overforecast_count / len(valid)) * 100.0

        max_over = float(valid["error_mw"].max())
        max_under = float(valid["error_mw"].min())

        buffer_90 = float(np.percentile(valid["abs_error_mw"], 90))
        buffer_95 = float(np.percentile(valid["abs_error_mw"], 95))

        return OverallMetricsSummary(
            total_days=int(valid["delivery_date"].nunique()),
            total_periods=len(valid),
            decision_cutoff_hour=cutoff_hour,
            mae_mw=round(mae, 1),
            rmse_mw=round(rmse, 1),
            mean_bias_mw=round(mean_bias, 1),
            wape_pct=round(wape, 2),
            overforecast_ratio_pct=round(overforecast_ratio, 1),
            max_overforecast_mw=round(max_over, 1),
            max_underforecast_mw=round(max_under, 1),
            confidence_buffer_90pct_mw=round(buffer_90, 1),
            confidence_buffer_95pct_mw=round(buffer_95, 1)
        )

    def get_diurnal_profile(self, cutoff_hour: int = 11) -> DiurnalProfileResponse:
        all_matched = self.get_matched_dataframe_for_month(cutoff_hour=cutoff_hour)
        valid = all_matched.dropna(subset=["actual_mw", "forecast_mw"])

        periods: List[DiurnalPeriodMetric] = []
        for sp in range(1, 49):
            sp_data = valid[valid["settlementPeriod"] == sp]
            if sp_data.empty:
                continue

            total_mins = (sp - 1) * 30
            hours = total_mins // 60
            mins = total_mins % 60
            time_label = f"{hours:02d}:{mins:02d}"

            avg_act = float(sp_data["actual_mw"].mean())
            avg_fc = float(sp_data["forecast_mw"].mean())
            mae = float(sp_data["abs_error_mw"].mean())
            bias = float(sp_data["error_mw"].mean())
            sum_act = float(sp_data["actual_mw"].sum())
            sum_abs = float(sp_data["abs_error_mw"].sum())
            wape = (sum_abs / sum_act * 100.0) if sum_act > 0 else 0.0

            periods.append(
                DiurnalPeriodMetric(
                    settlement_period=sp,
                    time_label=time_label,
                    avg_actual_mw=round(avg_act, 1),
                    avg_forecast_mw=round(avg_fc, 1),
                    mae_mw=round(mae, 1),
                    bias_mw=round(bias, 1),
                    wape_pct=round(wape, 2)
                )
            )

        return DiurnalProfileResponse(
            decision_cutoff_hour=cutoff_hour,
            periods=periods
        )

forecast_service = ForecastService()
