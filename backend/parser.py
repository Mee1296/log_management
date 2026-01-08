import re
import datetime
import json
from pydantic import BaseModel, Field
from typing import Optional


class LogSchema(BaseModel):
    timestamp: datetime.datetime
    tenant: str = "default"
    source: str
    vendor: Optional[str] = None
    product: Optional[str] = None      
    severity: int = 5
    action: Optional[str] = None
    event_type: Optional[str] = None
    event_subtype: Optional[str] = None
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: Optional[str] = None
    message: Optional[str] = None      
    policy: Optional[str] = None       
    interface: Optional[str] = None    
    user_name: Optional[str] = None
    host: Optional[str] = None
    process: Optional[str] = None
    url: Optional[str] = None
    http_method: Optional[str] = None
    status_code: Optional[int] = None
    rule_name: Optional[str] = None
    rule_id: Optional[str] = None
    cloud_account_id: Optional[str] = None
    cloud_region: Optional[str] = None
    cloud_service: Optional[str] = None
    raw_data: str

def parse_syslog_text(raw_msg):
    extracted = {
        "raw_data": raw_msg,
        "timestamp": datetime.datetime.now(),
        "tenant": "internal_system" 
    }

    if "vendor=" in raw_msg or "policy=" in raw_msg:
        extracted["source"] = "firewall"
    elif "event=link" in raw_msg or "if=" in raw_msg:
        extracted["source"] = "network"
    else:
        extracted["source"] = "syslog_unknown"

    pri_match = re.search(r'<(.*?)>', raw_msg)
    if pri_match:
        extracted["severity"] = int(pri_match.group(1)) % 8

    kv_pairs = re.findall(r'(\w+)=(.+?)(?=\s+\w+=|$)', raw_msg)
    field_map = {
        "src": "src_ip", 
        "dst": "dst_ip", 
        "spt": "src_port", 
        "dpt": "dst_port", 
        "proto": "protocol", 
        "action": "action",
        "vendor": "vendor", 
        "product": "product", 
        "policy": "policy",     
        "msg": "message",       
        "event": "event_type", 
        "reason": "event_subtype", 
        "if": "interface",      
        "mac": "mac_address"        
    }
    
    for key, value in kv_pairs:
        clean_val = value.strip()
        if key in field_map:
            if "port" in field_map[key]:
                try: extracted[field_map[key]] = int(clean_val)
                except: pass
            else:
                extracted[field_map[key]] = clean_val

    parts = raw_msg.split()
    if len(parts) >= 4:
        extracted["host"] = parts[3]

    return LogSchema(**extracted).model_dump()

def parse_log(raw_data, source_type):
    data = raw_data if isinstance(raw_data, dict) else json.loads(raw_data)
    
    extracted = {
        "raw_data": json.dumps(data),
        "source": source_type,
        "timestamp": data.get("@timestamp") or datetime.datetime.now(),
        "tenant": data.get("tenant", "default"),
        "severity": data.get("severity", 5),
        "action": data.get("action"),
        "event_type": data.get("event_type"),
        "user_name": data.get("user") or data.get("user_name"),
        "host": data.get("host"),
        "process": data.get("process")
    }

    if "cloud" in data:
        extracted.update({
            "cloud_account_id": data["cloud"].get("account_id"),
            "cloud_region": data["cloud"].get("region"),
            "cloud_service": data["cloud"].get("service")
        })

    try:
        return LogSchema(**extracted).model_dump()
    except Exception as e:
        print(f"Validation Error for {source_type}: {e}")
        return LogSchema(
            timestamp=datetime.datetime.now(),
            source=source_type,
            raw_data=str(raw_data)
        ).model_dump()