import requests
import json
import time
import socket

BASE_URL = "http://localhost:8000/ingest"

logs = logs = [
    # 1. API Ingest (HTTP) 
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
    # 2. CrowdStrike (JSON Sample)
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
    },
    # 3. AWS CloudTrail (Cloud Log) 
    {
        "type": "aws",
        "data": {
            "tenant": "demoB",
            "source": "aws",
            "cloud": {
                "service": "iam",
                "account_id": "123456789012",
                "region": "ap-southeast-1"
            },
            "event_type": "CreateUser",
            "user": "admin",
            "severity": 3,
            "@timestamp": "2025-08-20T09:10:00Z"
        }
    },
    # 4. Microsoft 365 Audit (SaaS Log) 
    {
        "type": "m365",
        "data": {
            "tenant": "demoB",
            "source": "m365",
            "event_type": "UserLoggedIn",
            "user": "bob@demo.local",
            "ip": "198.51.100.23",
            "severity": 1,
            "status": "Success",
            "@timestamp": "2025-08-20T10:05:00Z"
        }
    },
    # 5. Windows Security AD (EventID 4625)
    {
        "type": "ad",
        "data": {
            "tenant": "demoA",
            "source": "ad",
            "event_id": 4625,
            "event_type": "LogonFailed",
            "user": "demo\\eve",
            "host": "DC01",
            "ip": "203.0.113.77",
            "severity": 6,
            "@timestamp": "2025-08-20T11:11:11Z"
        }
    }
]

def send_udp_syslog():
    raw_logs = [
        "<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked policy=Block-DNS",
        "<190>Aug 20 13:01:02 r1 if=ge-0/0/1 event=link-down mac=aa:bb:cc:dd:ee:ff reason=carrier-loss"
    ]
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    for msg in raw_logs:
        try :
            print(f"Sending UDP Syslog: {msg}")
            sock.sendto(msg.encode('utf-8'), ("127.0.0.1", 514))
        except Exception as e:
            print(f"UDP Send Error: {e}")
        time.sleep(0.5)

def run_test():
    for log in logs:
        print(f"Sending {log['type']} log...")
        try:
            response = requests.post(f"{BASE_URL}/{log['type']}", json=log['data'])
            print(f"Status: {response.status_code}, Response: {response.json()}")
        except Exception as e:
            print(f"Failed to connect: {e}")
        time.sleep(0.5)

if __name__ == "__main__":
    # run_test()
    send_udp_syslog()