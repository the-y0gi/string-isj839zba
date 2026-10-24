import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "UK Wind Power Day-Ahead Trading Platform"
    API_V1_PREFIX: str = "/api"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    ACTUALS_FILE: str = "fuelhh_wind_jan2026.json"
    FORECASTS_FILE: str = "windfor_jan2026.json"

settings = Settings()
