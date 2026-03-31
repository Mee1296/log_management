import re
from datetime import datetime, timezone
import json
from pydantic import BaseModel, Field
from typing import Optional
from typing import Any

class LogSchema(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tenant: str = "default"
    source: str
    vendor: Optional[str] = None
    product: Optional[str] = None      
    severity: int = 5
    action: Optional[str] = None
    event_id: Optional[int] = None
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
    raw_data: Any

def normalize_timestamp(value) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)

    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return datetime.now(timezone.utc)

def parse_log(raw_data, source_type):
    data = raw_data if isinstance(raw_data, dict) else json.loads(raw_data)
    
    # Custom Parsing Logic
    if source_type == "aws":
        return LogSchema(
            timestamp=normalize_timestamp(data.get("eventTime")),
            tenant=data.get("tenant", "default"),
            source="aws",
            event_type=data.get("eventName"),
            user_name=data.get("userIdentity", {}).get("userName"),
            cloud_region=data.get("awsRegion"),
            src_ip=data.get("sourceIPAddress"),
            cloud_account_id=data.get("userIdentity", {}).get("accountId"),
            raw_data=json.dumps(data)
        ).model_dump()

    if source_type == "m365":
        return LogSchema(
            timestamp=normalize_timestamp(data.get("CreationTime")),
            tenant=data.get("tenant", "default"),
            source="m365",
            event_type=data.get("Operation"),
            user_name=data.get("UserId"),
            cloud_service=data.get("Workload"),
            src_ip=data.get("ClientIP"),
            raw_data=json.dumps(data)
        ).model_dump()
    
    if source_type == "ad" :
        # Mapping for Windows AD Logs (Event 4625 etc)
        return LogSchema(
            timestamp=normalize_timestamp(data.get("@timestamp")),
            tenant=data.get("tenant", "default"),
            source="ad",
            event_id=data.get("event_id"),
            event_type=data.get("event_type"),
            user_name=data.get("user"),    
            host=data.get("host"),
            src_ip=data.get("ip"),
            raw_data=json.dumps(data)
        ).model_dump()

    extracted = {
        "raw_data": json.dumps(data),
        "source": source_type,
        "timestamp": normalize_timestamp(data.get("@timestamp")),
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
            timestamp=datetime.now(timezone.utc),
            source=source_type,
            raw_data=str(raw_data)
        ).model_dump()