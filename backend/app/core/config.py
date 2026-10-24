import os
from pydantic import BaseModel

def get_cors_origins() -> list[str]:
    env_origins = os.getenv("CORS_ORIGINS", "")
    if env_origins:
        return [o.strip() for o in env_origins.split(",") if o.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "UK Wind Power Day-Ahead Trading Platform")
    API_V1_PREFIX: str = "/api"
    BACKEND_CORS_ORIGINS: list[str] = get_cors_origins()
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    ACTUALS_FILE: str = "fuelhh_wind_jan2026.json"
    FORECASTS_FILE: str = "windfor_jan2026.json"

settings = Settings()
