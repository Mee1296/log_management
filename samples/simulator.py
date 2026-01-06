import requests
import json
import time

BASE_URL = "http://localhost:8000/ingest"

# รวมตัวอย่าง Log จากโจทย์ 
logs = [
    {
        "type": "api",
        "data": {
            "tenant": "demo",
            "source": "api",
            "event_type": "app_login_failed",
            "user": "alice",
            "ip": "203.0.113.7",
            "reason": "wrong password",
            "@timestamp": "2025-08-20T07:20:00Z"
        }
    },
    {
        "type": "crowdstrike",
        "data": {
            "tenant": "demoA",
            "source": "crowdstrike",
            "event_type": "malware_detected",
            "host": "WIN10-01",
            "process": "powershell.exe",
            "severity": 8,
            "action": "quarantine",
            "@timestamp": "2025-08-20T08:00:00Z"
        }
    }
]

def run_test():
    for log in logs:
        print(f"Sending {log['type']} log...")
        try:
            # ยิงไปที่ endpoint ตาม source_type
            response = requests.post(f"{BASE_URL}/{log['type']}", json=log['data'])
            print(f"Status: {response.status_code}, Response: {response.json()}")
        except Exception as e:
            print(f"Failed to connect: {e}")
        time.sleep(1)

if __name__ == "__main__":
    run_test()