import pytest
from fastapi.testclient import TestClient
from main import app
from services.parser import parse_syslog_text
import os

client = TestClient(app)

VALID_KEY = os.getenv("INGEST_API_KEYS", "admin-key").split(",")[0]

# --- Parser Unit Tests ---
def test_firewall_parser():
    raw = "<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53 proto=udp msg=DNS blocked"
    res = parse_syslog_text(raw)
    assert res["source"] == "firewall"
    assert res["src_ip"] == "10.0.1.10"
    assert res["action"] == "deny"

# --- API Integration Tests ---
def test_ingest_unauthorized():
    # wrong/no key, 403 Forbidden
    response = client.post("/api/v1/ingest/api", json={"test": "data"}, headers={"X-API-KEY": "wrong-secret"})
    assert response.status_code == 403

def test_ingest_authorized():
    # correct key, 200 OK
    headers = {"X-API-KEY": VALID_KEY}
    payload = {"tenant": "demoA", "source": "api", "event_type": "test", "severity": 5}
    response = client.post("/api/v1/ingest/api", json=payload, headers=headers)
    assert response.status_code == 200

# --- Business Logic Tests ---
def test_severity_alert_trigger():
    # severity >= 8, alert should be triggered
    raw = "<14>Aug 20 12:00:00 host severity=9 msg=critical_error"
    res = parse_syslog_text(raw)
    assert res["severity"] >= 8