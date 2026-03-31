from fastapi import APIRouter, Request, HTTPException, Query, Depends
from services.parser import parse_log
from db.repository import save_to_db, fetch_from_db, save_alert
from typing import Optional, Union, List
from api.auth import User, get_current_user, verify_ingest_key
from datetime import datetime, timezone

router = APIRouter()

def validate_tenant_access(user: User, tenant: str):
    if user.role != "admin" and user.tenant_access != tenant:
        raise HTTPException(status_code=403, detail="Access to this tenant is forbidden")


@router.post("/ingest/{source_type}")
async def ingest_logs(
    source_type: str, 
    request: Request,
    api_key: str = Depends(verify_ingest_key) # Ensure API key check
):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
         raise HTTPException(status_code=400, detail="Payload must be JSON object or array")

    parsed_list = []
    
    for item in data:
        tenant = item.get("tenant") or request.headers.get("X-Tenant-ID") or "default"
        item["tenant"] = tenant

        try:
            parsed = parse_log(item, source_type)
            parsed_list.append(parsed)

            if parsed.get("severity", 0) >= 7:
                await save_alert({
                    "timestamp": parsed.get("timestamp") or datetime.now(timezone.utc),
                    "severity": parsed.get("severity"),
                    "message": str(parsed.get("event_type") or parsed.get("message") or "High Severity Event"),
                    "source": parsed.get("source"),
                    "tenant": parsed.get("tenant")
                })
        except Exception as e:
            print(f"Error parsing log item: {e}")

    if parsed_list:
        await save_to_db(parsed_list) 
    
    return {"status": "stored", "count": len(parsed_list)}

@router.get("/logs")
async def get_logs(
        tenant: Optional[str] = None, 
        source: Optional[str] = None, 
        severity: Optional[int] = None,
        limit: int = Query(100, le=10000),
        user: User = Depends(get_current_user)
    ):
    if tenant:
        validate_tenant_access(user, tenant)
    
    if user.role != 'admin':
        tenant = user.tenant_access
    
    query = "SELECT * FROM logs"
    params = {}
    conditions = []

    if tenant and tenant != "*":
        conditions.append("tenant = :tenant")
        params["tenant"] = tenant
    
    if source:
        conditions.append("source = :source")
        params["source"] = source
    if severity is not None:
        conditions.append("severity = :severity")
        params["severity"] = severity
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY timestamp DESC LIMIT :limit"
    params["limit"] = limit
    
    return await fetch_from_db(query, params)

@router.get("/stats/sources")
async def get_stats_sources_all(user: User = Depends(get_current_user)):
    if user.role != 'admin':
        return await get_stats_sources(user.tenant_access, user)

    query = "SELECT source, COUNT(*) as count FROM logs GROUP BY source ORDER BY count DESC"
    return await fetch_from_db(query)

@router.get("/stats/sources/{tenant}")
async def get_stats_sources(tenant: str, user: User = Depends(get_current_user)):
    validate_tenant_access(user, tenant)
    query = "SELECT source, COUNT(*) as count FROM logs WHERE tenant = :tenant GROUP BY source ORDER BY count DESC"
    return await fetch_from_db(query, {"tenant": tenant})
    
@router.get("/stats/timeline")
async def get_stats_timeline_all(user: User = Depends(get_current_user)):
    if user.role != 'admin':
        return await get_stats_timeline(user.tenant_access, user)

    query = "SELECT date_trunc('hour', timestamp) as bucket, COUNT(*) as count FROM logs GROUP BY bucket ORDER BY bucket ASC"
    return await fetch_from_db(query)

@router.get("/stats/timeline/{tenant}")
async def get_stats_timeline(tenant: str, user: User = Depends(get_current_user)):
    validate_tenant_access(user, tenant)
    query = "SELECT date_trunc('hour', timestamp) as bucket, COUNT(*) as count FROM logs WHERE tenant = :tenant GROUP BY bucket ORDER BY bucket ASC"
    return await fetch_from_db(query, {"tenant": tenant})

@router.get("/tenants")
async def get_tenants(user: User = Depends(get_current_user)):
    if user.role != 'admin':
        return [user.tenant_access]
    
    query = "SELECT DISTINCT tenant FROM logs ORDER BY tenant"
    rows = await fetch_from_db(query)
    return [r["tenant"] for r in rows if r["tenant"]]
