import requests
import json
from datetime import datetime, timezone
import time
import random
import socket
import os
from dotenv import load_dotenv
import urllib3

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

dev_status = os.getenv("STATUS", "deployment")

if dev_status != "development":
    API_URL = "https://backend-production-022e.up.railway.app/api/v1/ingest"
    UDP_IP = "10.64.0.2"
else :
    API_URL = "https://localhost/api/v1/ingest"
    UDP_IP =  "127.0.0.1"
UDP_PORT = 514

HEADERS = {
    "Content-Type": "application/json",
    "X-API-KEY": "admin-key",
    "X-Tenant-ID": "demo"
}

SOURCES = ["api", "aws", "crowdstrike", "firewall", "m365"]
EVENT_TYPES = ["login_success", "login_failed", "file_access", "network_connection", "process_start"]
TENANT = ["demoA", "demoB", "demoC"]

def generate_log(source=None):
    source = source or random.choice(SOURCES)
    severity = random.choices([1, 3, 5, 8, 9], weights=[50, 30, 10, 5, 5])[0]
    
    log = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tenant": TENANT[random.randint(0,2)],
        "source": source,
        "severity": severity,
        "event_type": random.choice(EVENT_TYPES),
        "message": f"Simulated event from {source}",
        "host": f"host-{random.randint(1, 10)}",
        "user": f"user-{random.randint(1, 50)}"
    }
    return log

def send_http_log():
    try:
        log = generate_log()
        resp = requests.post(f"{API_URL}/{log['source']}", json=log, headers=HEADERS, verify=False)
        print(f"[HTTP] Single: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] Error: {e}")

def send_aws_log():
    try:
        log = {
            "eventTime": datetime.now(timezone.utc).isoformat(),
            "eventName": "ConsoleLogin",
            "userIdentity": {
                "type": "IAMUser",
                "userName": f"user-{random.randint(1,20)}",
                "accountId": "123456789012"
            },
            "source": "aws",
            "tenant": "demo",
            "awsRegion": "us-east-1",
            "sourceIPAddress": f"10.0.{random.randint(1,255)}.{random.randint(1,255)}"
        }
        # Send to /ingest/aws
        resp = requests.post(f"{API_URL}/aws", json=log, headers=HEADERS, verify=False)
        print(f"[HTTP] AWS: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] AWS Error: {e}")

def send_m365_log():
    try:
        log = {
            "CreationTime": datetime.now(timezone.utc).isoformat(),
            "Operation": "UserLoggedIn",
            "UserId": f"user-{random.randint(1,20)}@example.com",
            "source": "m365",
            "tenant": "demo", 
            "Workload": "Exchange",
            "ClientIP": f"192.168.{random.randint(1,255)}.{random.randint(1,255)}"
        }
        # Send to /ingest/m365
        resp = requests.post(f"{API_URL}/m365", json=log, headers=HEADERS, verify=False)
        print(f"[HTTP] M365: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] M365 Error: {e}")

def send_ad_log():
    try:
        log = {
            "tenant": random.choice(["demoA", "demoB"]),
            "source": "ad",
            "event_id": 4625, # Logon Failed
            "event_type": "LogonFailed",
            "user": f"demo\\{random.choice(['admin', 'guest', 'eve'])}",
            "severity": 9, # Severity สูงเพื่อทดสอบระบบ Alert
            "ip": f"192.168.1.{random.randint(100,200)}",
            "@timestamp": datetime.now(timezone.utc).isoformat()
        }
        resp = requests.post(f"{API_URL}/ad", json=log, headers=HEADERS, verify=False)
        print(f"[HTTP] AD Security: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] AD Error: {e}")

def send_batch_log():
    try:
        batch = [generate_log() for _ in range(random.randint(2, 5))]
        # Use 'batch' source type or generic
        resp = requests.post(f"{API_URL}/batch_loader", json=batch, headers=HEADERS, verify=False)
        print(f"[HTTP] Batch ({len(batch)}): {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] Batch Error: {e}")

def send_udp_log():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        msg = f"<14>1 {datetime.now(timezone.utc).isoformat()} host-udp app - - - This is a syslog message severity=5"
        sock.sendto(msg.encode(), (UDP_IP, UDP_PORT))
        print(f"[UDP] Sent")
    except Exception as e:
        print(f"[UDP] Error: {e}")

if __name__ == "__main__":
    print("Starting Traffic Simulator...")
    count = 0
    while count < 100:
        send_http_log()
        if random.random() < 0.3:
            send_batch_log()
        if random.random() < 0.2:
            send_udp_log()
        if random.random() < 0.2:
            send_aws_log()
        if random.random() < 0.2:
            send_m365_log()
        if random.random() < 0.2:
            send_ad_log()
        
        # time.sleep(0.1)
        count += 1
    print("Traffic Simulation Completed.")