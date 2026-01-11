import requests
import json
import time
import random
import datetime
import socket

API_URL = "http://localhost:8000/api/v1/ingest"
UDP_IP = "127.0.0.1"
UDP_PORT = 514

HEADERS = {
    "Content-Type": "application/json",
    "X-API-KEY": "admin-key",
    "INGEST_API_KEY_NAME": "admin-key",
    "X-Tenant-ID": "demo"
}

SOURCES = ["api", "aws", "crowdstrike", "firewall", "m365"]
EVENT_TYPES = ["login_success", "login_failed", "file_access", "network_connection", "process_start"]

def generate_log(source=None):
    source = source or random.choice(SOURCES)
    severity = random.choices([1, 3, 5, 8, 9], weights=[50, 30, 10, 5, 5])[0]
    
    log = {
        "timestamp": datetime.datetime.now().isoformat(),
        "tenant": "demo",
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
        resp = requests.post(f"{API_URL}/{log['source']}", json=log, headers=HEADERS)
        print(f"[HTTP] Single: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] Error: {e}")

def display_error(resp):
    if resp.status_code != 200:
        print(f"[{resp.status_code}] {resp.text}")

def send_http_log():
    try:
        log = generate_log()
        resp = requests.post(f"{API_URL}/{log['source']}", json=log, headers=HEADERS)
        print(f"[HTTP] Single: {resp.status_code}")
        display_error(resp)
    except Exception as e:
        print(f"[HTTP] Error: {e}")

def send_aws_log():
    try:
        log = {
            "eventTime": datetime.datetime.now().isoformat(),
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
        resp = requests.post(f"{API_URL}/aws", json=log, headers=HEADERS)
        print(f"[HTTP] AWS: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] AWS Error: {e}")

def send_m365_log():
    try:
        log = {
            "CreationTime": datetime.datetime.now().isoformat(),
            "Operation": "UserLoggedIn",
            "UserId": f"user-{random.randint(1,20)}@example.com",
            "source": "m365",
            "tenant": "demo", 
            "Workload": "Exchange",
            "ClientIP": f"192.168.{random.randint(1,255)}.{random.randint(1,255)}"
        }
        # Send to /ingest/m365
        resp = requests.post(f"{API_URL}/m365", json=log, headers=HEADERS)
        print(f"[HTTP] M365: {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] M365 Error: {e}")

def send_batch_log():
    try:
        batch = [generate_log() for _ in range(random.randint(2, 5))]
        # Use 'batch' source type or generic
        resp = requests.post(f"{API_URL}/batch_loader", json=batch, headers=HEADERS)
        print(f"[HTTP] Batch ({len(batch)}): {resp.status_code}")
    except Exception as e:
        print(f"[HTTP] Batch Error: {e}")

def send_udp_log():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        msg = f"<14>1 {datetime.datetime.now().isoformat()} host-udp app - - - This is a syslog message severity=5"
        sock.sendto(msg.encode(), (UDP_IP, UDP_PORT))
        print(f"[UDP] Sent")
    except Exception as e:
        print(f"[UDP] Error: {e}")

if __name__ == "__main__":
    print("Starting Traffic Simulator...")
    count = 0;
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
        
        time.sleep(0.5)
        count += 1
    print("Traffic Simulation Completed.")