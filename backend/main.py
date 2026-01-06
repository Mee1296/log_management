from fastapi import FastAPI, Request, HTTPException
import psycopg2
import os
import datetime

app = FastAPI()

# ดึงค่าจาก Docker Compose env
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password123@db:5432/log_db")

@app.get("/")
def root():
    return {"message": "Log Management API is running"}
    
@app.post("/ingest/{source_type}")
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    tenant = data.get("tenant") or request.headers.get("X-Tenant-ID")
    if not tenant:
        raise HTTPException(status_code=400, detail="Missing tenant information")

    normalized_data = {
        "timestamp": data.get("@timestamp", datetime.datetime.now().isoformat()),
        "tenant": tenant,
        "source": source_type,
        "event_type": data.get("event_type"),
        "severity": data.get("severity", 5),
        "user_name": data.get("user") or data.get("user_name"),
        "raw_data": data 
    }

    return {"status": "success", "processed_as": source_type}