import pytest
from parser import parse_log, parse_syslog_text
from datetime import datetime

# JSON-based logs
@pytest.mark.parametrize("source, raw_input, expected_tenant", [
    ("api", {"tenant": "demo", "source": "api", "event_type": "login"}, "demo"),
    ("aws", {"tenant": "demoB", "cloud": {"account_id": "12345"}}, "demoB"),
    ("crowdstrike", {"tenant": "demoA", "severity": 8}, "demoA"),
])
def test_json_parsing(source, raw_input, expected_tenant):
    result = parse_log(raw_input, source)
    assert result["tenant"] == expected_tenant
    assert result["source"] == source
    assert "timestamp" in result

# Syslog (Text-based)
def test_firewall_syslog_parsing():
    raw = "<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53"
    result = parse_syslog_text(raw)
    assert result["source"] == "firewall"
    assert result["action"] == "deny"
    assert result["src_ip"] == "10.0.1.10"
    assert result["severity"] == 6 

def test_network_router_parsing():
    raw = "<190>Aug 20 13:01:02 r1 if=ge-0/0/1 event=link-down mac=aa:bb reason=carrier-loss"
    result = parse_syslog_text(raw)
    assert result["source"] == "network"
    assert result["event_type"] == "link-down"
    assert result["interface"] == "ge-0/0/1"

# Error handling 
def test_invalid_json():
    result = parse_log({}, "unknown")
    assert result["source"] == "unknown"
    assert result["tenant"] == "default"

def test_empty_syslog():
    result = parse_syslog_text("")
    assert result["raw_data"] == {"full_message": ""}
    assert result["tenant"] == "internal_system"