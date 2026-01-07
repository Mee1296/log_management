import re
import datetime
import json

def parse_syslog_text(raw_msg):
    normalized = {
        "raw_data": raw_msg,
        "source": "firewall", # เริ่มต้นเป็น firewall
        "timestamp": datetime.now().isoformat()
    }

    # severity
    pri_match = re.search(r'<(.*?)>', raw_msg)
    if pri_match:
        priority = int(pri_match.group(1))
        normalized["severity"] = priority % 8 # Syslog severity calculation

    # hostname
    parts = raw_msg.split(' ')
    if len(parts) > 3:
        normalized["host"] = parts[3]

    # key-value pairs
    kv_pairs = re.findall(r'(\w+)=([\w\.\-\/:]+)', raw_msg)
    field_map = {
        "src": "src_ip", "dst": "dst_ip", "spt": "src_port", 
        "dpt": "dst_port", "proto": "protocol", "vendor": "vendor",
        "product": "product", "action": "action", "policy": "rule_name"
    }
    
    for key, value in kv_pairs:
        if key in field_map:
            normalized[field_map[key]] = value

    # Network/router
    if "event" in raw_msg and "mac=" in raw_msg:
        normalized["source"] = "network"
        normalized["event_type"] = re.search(r'event\s+(\S+)', raw_msg).group(1)
        
    return normalized

def parse_log(raw_data, source_type):
    normalized = {
        "timestamp": datetime.datetime.now().isoformat(),
        "tenant": "default",
        "source": source_type,
        "severity": 5,
        "raw_data": json.dumps(raw_data) if isinstance(raw_data, dict) else raw_data 
    }

    if source_type in ["api", "crowdstrike", "aws", "m365"]:
        # JSON
        data = raw_data if isinstance(raw_data, dict) else json.loads(raw_data)
        normalized.update({
            "timestamp": data.get("@timestamp", normalized["timestamp"]),
            "tenant": data.get("tenant", "default"),
            "event_type": data.get("event_type"),
            "user_name": data.get("user") or data.get("user_name"),
            "severity": data.get("severity", 5),
            "action": data.get("action")
        })
        # Cloud
        if "cloud" in data:
            normalized["cloud_account_id"] = data["cloud"].get("account_id")
            normalized["cloud_region"] = data["cloud"].get("region")

    return normalized