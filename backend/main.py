import os
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from db.repository import save_to_db, fetch_from_db
from services.parser import parse_log, parse_syslog_text

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify allowed origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Schema
from fastapi import Security, Depends
from fastapi.security.api_key import APIKeyHeader

API_KEY_NAME = os.getenv("INGEST_API_KEY_NAME", "X-API-KEY")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Simple in-memory check (for demo). In production, check against DB/Env.
VALID_API_KEYS = ["secret-key-123", "admin-key"]

async def verify_ingest_key(api_key: str = Security(api_key_header)):
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}