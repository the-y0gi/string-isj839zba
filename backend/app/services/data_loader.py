import os
import json
from typing import Optional, Tuple
import pandas as pd
from app.core.config import settings

class DataLoader:
    _instance: Optional["DataLoader"] = None
    _actuals_df: Optional[pd.DataFrame] = None
    _forecasts_df: Optional[pd.DataFrame] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_data()
        return cls._instance

    def _load_data(self):
        actuals_path = os.path.join(settings.DATA_DIR, settings.ACTUALS_FILE)
        forecasts_path = os.path.join(settings.DATA_DIR, settings.FORECASTS_FILE)

        if os.path.exists(actuals_path):
            with open(actuals_path, "r", encoding="utf-8") as f:
                raw_actuals = json.load(f)
            df_act = pd.DataFrame(raw_actuals)
            df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
            df_act["settlementPeriod"] = df_act["settlementPeriod"].astype(int)
            df_act["generation"] = pd.to_numeric(df_act["generation"], errors="coerce")
            self._actuals_df = df_act.sort_values("startTime").reset_index(drop=True)
        else:
            self._actuals_df = pd.DataFrame()

        if os.path.exists(forecasts_path):
            with open(forecasts_path, "r", encoding="utf-8") as f:
                raw_forecasts = json.load(f)
            df_fc = pd.DataFrame(raw_forecasts)
            df_fc["startTime"] = pd.to_datetime(df_fc["startTime"], utc=True)
            df_fc["publishTime"] = pd.to_datetime(df_fc["publishTime"], utc=True)
            df_fc["generation"] = pd.to_numeric(df_fc["generation"], errors="coerce")
            self._forecasts_df = df_fc.sort_values(["startTime", "publishTime"]).reset_index(drop=True)
        else:
            self._forecasts_df = pd.DataFrame()

    def get_dataframes(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        return self._actuals_df, self._forecasts_df

    def reload(self):
        self._load_data()

data_loader = DataLoader()
