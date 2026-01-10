from fastapi import APIRouter, Request, HTTPException, Query, Depends
from services.parser import parse_log
from db.repository import save_to_db, fetch_from_db
from typing import Optional
from api.auth import verify_ingest_key

router = APIRouter()

# search api for each tenant
@router.get("/logs")
async def get_logs(
        tenant: str, 
        source: Optional[str] = None, 
        severity: Optional[int] = None,
        limit: int = Query(100, le=1000)
    ):
    query = "SELECT * FROM logs WHERE tenant = %s"
    params = [tenant]
    
    if source:
        query += " AND source = %s"
        params.append(source)
    if severity is not None:
        query += " AND severity = %s"
        params.append(severity)
        
    query += " ORDER BY timestamp DESC LIMIT %s"
    params.append(limit)
    
    return fetch_from_db(query, tuple(params))

# for top sources
@router.get("/stats/sources/{tenant}")
async def get_stats_sources(tenant: str):
    query = """
        SELECT source, COUNT(*) as count 
        FROM logs WHERE tenant = %s 
        GROUP BY source 
        ORDER BY count DESC
    """
    return fetch_from_db(query, (tenant,))
    
# Timeline api
@router.get("/stats/timeline/{tenant}")
async def get_stats_timeline(tenant: str):
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
async def get_severity_trend(tenant: str):
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

@router.post("/ingest/{source_type}", dependencies=[Depends(verify_ingest_key)])
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    tenant = data.get("tenant") or request.headers.get("X-Tenant-ID")
    if not tenant:
        raise HTTPException(status_code=400, detail="Missing tenant information")

    parsed = parse_log(data, source_type) 
    save_to_db(parsed) 
    return {"status": "stored", "data": parsed}