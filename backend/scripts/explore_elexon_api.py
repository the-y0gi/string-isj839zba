"""
Explore Elexon BMRS API endpoints for:
1. Actuals: FUELHH (filtered for fuelType == 'WIND')
2. Forecasts: WINDFOR

Uses python standard library (urllib) so it can run without external dependencies.
"""
import json
import urllib.request
import urllib.error
import sys

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

def test_endpoint(dataset_name: str, params: dict):
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{BASE_URL}/{dataset_name}/stream?{query_string}"
    print(f"\n[Testing] URL: {url}")
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WindAnalytics/1.0"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            print(f"Status: {status}, Content-Type: {content_type}")
            
            # Read first chunk or complete payload
            data = resp.read()
            # Try parsing as JSON or JSON-lines
            try:
                parsed = json.loads(data.decode("utf-8"))
                if isinstance(parsed, list):
                    print(f"Received {len(parsed)} items (List format)")
                    if len(parsed) > 0:
                        print("Sample record 0:")
                        print(json.dumps(parsed[0], indent=2))
                elif isinstance(parsed, dict):
                    print("Received Dict format with keys:", list(parsed.keys()))
                    if "data" in parsed:
                        print(f"Data length: {len(parsed['data'])}")
                        if len(parsed["data"]) > 0:
                            print("Sample item 0:", json.dumps(parsed["data"][0], indent=2))
                    else:
                        print(json.dumps(parsed, indent=2)[:500])
                return parsed
            except Exception as e:
                # Might be NDJSON (newline-delimited JSON) stream
                lines = data.decode("utf-8").strip().split("\n")
                print(f"Received {len(lines)} lines (NDJSON stream format)")
                if len(lines) > 0:
                    try:
                        sample = json.loads(lines[0])
                        print("Sample record from line 0:")
                        print(json.dumps(sample, indent=2))
                    except Exception:
                        print("First line raw preview:", lines[0][:200])
                return lines
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        print("Response body:", e.read().decode("utf-8", errors="ignore")[:300])
    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    print("--- 1. Testing FUELHH (Actuals) for Jan 1, 2026 ---")
    # Testing with settlementDateFrom or publishDateTimeFrom
    test_endpoint("FUELHH", {
        "settlementDateFrom": "2026-01-01",
        "settlementDateTo": "2026-01-02",
        "fuelType": "WIND"
    })

    print("\n--- 2. Testing WINDFOR (Forecasts) for Jan 1, 2026 ---")
    test_endpoint("WINDFOR", {
        "publishDateTimeFrom": "2025-12-31T00:00:00Z",
        "publishDateTimeTo": "2026-01-01T23:59:59Z"
    })
