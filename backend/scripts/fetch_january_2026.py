import json
import os
import sys
import time
from datetime import datetime, timedelta
import requests

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "WindPowerAnalytics/1.0 (UK Day-Ahead Energy Trading Desk)"
}

def ensure_dir(path: str):
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

def fetch_fuelhh_actuals(start_date: str = "2026-01-01", end_date: str = "2026-01-31"):
    current_start = datetime.strptime(start_date, "%Y-%m-%d")
    final_end = datetime.strptime(end_date, "%Y-%m-%d")
    
    all_records = []
    chunk_days = 7
    
    while current_start <= final_end:
        chunk_end = min(current_start + timedelta(days=chunk_days - 1), final_end)
        s_from = current_start.strftime("%Y-%m-%d")
        s_to = chunk_end.strftime("%Y-%m-%d")
        
        url = f"{BASE_URL}/FUELHH/stream?settlementDateFrom={s_from}&settlementDateTo={s_to}&fuelType=WIND"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=45)
            resp.raise_for_status()
            data = resp.json()
            records = data if isinstance(data, list) else data.get("data", [])
            all_records.extend(records)
        except Exception as e:
            print(f"Error: {e}")
            
        current_start = chunk_end + timedelta(days=1)
        time.sleep(0.5)

    deduped = {}
    for r in all_records:
        st = r.get("startTime")
        if st:
            deduped[st] = r
            
    sorted_records = sorted(deduped.values(), key=lambda x: x.get("startTime", ""))
    output_file = os.path.join(DATA_DIR, "fuelhh_wind_jan2026.json")
    ensure_dir(DATA_DIR)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(sorted_records, f, indent=2)
    return sorted_records

def fetch_windfor_forecasts(start_date: str = "2025-12-30", end_date: str = "2026-01-31"):
    current_start = datetime.strptime(start_date, "%Y-%m-%d")
    final_end = datetime.strptime(end_date, "%Y-%m-%d")
    
    all_records = []
    chunk_days = 5
    
    while current_start <= final_end:
        chunk_end = min(current_start + timedelta(days=chunk_days - 1), final_end)
        s_from = f"{current_start.strftime('%Y-%m-%d')}T00:00:00Z"
        s_to = f"{chunk_end.strftime('%Y-%m-%d')}T23:59:59Z"
        
        url = f"{BASE_URL}/WINDFOR/stream?publishDateTimeFrom={s_from}&publishDateTimeTo={s_to}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            records = data if isinstance(data, list) else data.get("data", [])
            all_records.extend(records)
        except Exception as e:
            print(f"Error: {e}")
            
        current_start = chunk_end + timedelta(days=1)
        time.sleep(0.5)

    deduped = {}
    for r in all_records:
        key = (r.get("publishTime"), r.get("startTime"))
        if key[0] and key[1]:
            deduped[key] = r
            
    sorted_records = sorted(
        deduped.values(),
        key=lambda x: (x.get("startTime", ""), x.get("publishTime", ""))
    )
    output_file = os.path.join(DATA_DIR, "windfor_jan2026.json")
    ensure_dir(DATA_DIR)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(sorted_records, f, indent=2)
    return sorted_records

if __name__ == "__main__":
    actuals = fetch_fuelhh_actuals("2026-01-01", "2026-01-31")
    forecasts = fetch_windfor_forecasts("2025-12-30", "2026-01-31")
