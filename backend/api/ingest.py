from fastapi import APIRouter, Request, HTTPException, Query, Depends
from services.parser import parse_log
from db.repository import save_to_db, fetch_from_db, save_alert
from typing import Optional, Union, List
from api.auth import verify_ingest_key, get_current_user, User
from datetime import datetime, timezone

router = APIRouter()

def validate_tenant_access(user: User, tenant: str):
    if user.role != "admin" and user.tenant_access != tenant:
        raise HTTPException(status_code=403, detail="Access to this tenant is forbidden")


@router.post("/ingest/{source_type}")
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
         raise HTTPException(status_code=400, detail="Payload must be JSON object or array")

    parsed_list = []
    
    for item in data:
        # Default tenant if missing
        tenant = item.get("tenant") or request.headers.get("X-Tenant-ID") or "default"
        item["tenant"] = tenant # Ensure parsed log has tenant

        parsed = parse_log(item, source_type)
        parsed_list.append(parsed)
        
        # Alert Logic (Severity >= 8)
        if parsed.get("severity", 0) >= 8:
            alert_payload = {
                "timestamp": parsed.get("timestamp") or datetime.now(timezone.utc),
                "severity": parsed.get("severity"),
                "message": str(parsed.get("event_type") or parsed.get("message") or "High Severity Event"),
                "source": parsed.get("source"),
                "tenant": parsed.get("tenant")
            }
            save_alert(alert_payload)

    save_to_db(parsed_list) 
    return {"status": "stored", "count": len(parsed_list)}

# search api for each tenant
@router.get("/logs")
async def get_logs(
        tenant: Optional[str] = None, 
        source: Optional[str] = None, 
        severity: Optional[int] = None,
        limit: int = Query(100, le=1000),
        user: User = Depends(get_current_user)
    ):
    if tenant:
        validate_tenant_access(user, tenant)
    
    query = "SELECT * FROM logs"
    params = []
    conditions = []

    if tenant:
        conditions.append("tenant = %s")
        params.append(tenant)
    
    if source:
        conditions.append("source = %s")
        params.append(source)
    if severity is not None:
        conditions.append("severity = %s")
        params.append(severity)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY timestamp DESC LIMIT %s"
    params.append(limit)
    
    return fetch_from_db(query, tuple(params))

# for top sources
@router.get("/stats/sources")
async def get_stats_sources_all(user: User = Depends(get_current_user)):
    query = """
        SELECT source, COUNT(*) as count 
        FROM logs 
        GROUP BY source 
        ORDER BY count DESC
    """
    return fetch_from_db(query, ())

@router.get("/stats/sources/{tenant}")
async def get_stats_sources(tenant: str, user: User = Depends(get_current_user)):
    validate_tenant_access(user, tenant)
    query = """
        SELECT source, COUNT(*) as count 
        FROM logs WHERE tenant = %s 
        GROUP BY source 
        ORDER BY count DESC
    """
    return fetch_from_db(query, (tenant,))
    
# Timeline api
@router.get("/stats/timeline")
async def get_stats_timeline_all(user: User = Depends(get_current_user)):
    query = """
        SELECT date_trunc('hour', timestamp) as bucket, COUNT(*) as count 
        FROM logs 
        GROUP BY bucket 
        ORDER BY bucket ASC
    """
    return fetch_from_db(query, ())

@router.get("/stats/timeline/{tenant}")
async def get_stats_timeline(tenant: str, user: User = Depends(get_current_user)):
    validate_tenant_access(user, tenant)
    query = """
        SELECT date_trunc('hour', timestamp) as bucket, COUNT(*) as count 
        FROM logs 
        WHERE tenant = %s 
        GROUP BY bucket 
        ORDER BY bucket ASC
    """
    return fetch_from_db(query, (tenant,))

# Severity trend api
@router.get("/stats/severity-trend/{tenant}")
async def get_severity_trend(tenant: str, user: User = Depends(get_current_user)):
    validate_tenant_access(user, tenant)
    query = """
        SELECT 
            date_trunc('hour', timestamp) as time_bucket,
            severity,
            COUNT(*) as count
        FROM logs 
        WHERE tenant = %s
        GROUP BY time_bucket, severity
        ORDER BY time_bucket ASC
    """
    return fetch_from_db(query, (tenant,))

@router.get("/tenants")
async def get_tenants(user: User = Depends(get_current_user)):
    if user.role != 'admin':
         # Viewer sees only their tenant
        return [user.tenant_access]
    
    query = "SELECT DISTINCT tenant FROM logs ORDER BY tenant"
    rows = fetch_from_db(query, ())
    return [r["tenant"] for r in rows if r["tenant"]]


