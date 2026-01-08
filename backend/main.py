from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Query
from db import save_to_db, fetch_from_db
import threading
import socket
from parser import parse_log, parse_syslog_text

app = FastAPI()

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}

# search api for each tenant
@app.get("/api/v1/logs")
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
@app.get("/api/v1/stats/sources/{tenant}")
async def get_stats_sources(tenant: str):
    query = """
        SELECT source, COUNT(*) as count 
        FROM logs WHERE tenant = %s 
        GROUP BY source 
        ORDER BY count DESC
    """
    return fetch_from_db(query, (tenant,))
    
# Timeline api
@app.get("/api/v1/stats/timeline/{tenant}")
async def get_stats_timeline(tenant: str):
    query = """
        SELECT date_trunc('hour', timestamp) as bucket, COUNT(*) as count 
        FROM logs 
        WHERE tenant = %s 
        GROUP BY bucket 
        ORDER BY bucket ASC
    """
    return fetch_from_db(query, (tenant,))

@app.post("/ingest/{source_type}")
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    tenant = data.get("tenant") or request.headers.get("X-Tenant-ID")
    if not tenant:
        raise HTTPException(status_code=400, detail="Missing tenant information")

    parsed = parse_log(data, source_type) 
    save_to_db(parsed) 
    return {"status": "stored", "data": parsed}

def syslog_udp_server():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 514))
    print("UDP Syslog Server listening on port 514...")
    
    while True:
        data, addr = sock.recvfrom(4096)
        raw_msg = data.decode('utf-8', errors='ignore')
        print(f"UDP Received: {raw_msg}")
        
        try:
            parsed_data = parse_syslog_text(raw_msg)
            if not parsed_data.get("tenant"):
                parsed_data["tenant"] = "default"            
            save_to_db(parsed_data)
        except Exception as e:
            print(f"UDP Processing Error: {e}")    

try:
    udp_thread = threading.Thread(target=syslog_udp_server, daemon=True)
    udp_thread.start()
    print("Started UDP Syslog server thread.")
except Exception as e:
    print(f"Failed to start UDP server thread: {e}")