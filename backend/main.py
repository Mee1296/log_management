import os
import threading
from fastapi import FastAPI, Request, HTTPException, Query, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from services.syslog import syslog_udp_server
from api import ingest, auth, alerts
from services.background_tasks import monitor_alerts
from dotenv import load_dotenv
import asyncio

load_dotenv()

app = FastAPI()

origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost")
origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security: API Key for Ingestion ---
API_KEY_NAME = os.getenv("INGEST_API_KEY_NAME", "X-API-KEY")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

api_keys_str = os.getenv("INGEST_API_KEYS", "")
VALID_API_KEYS = [key.strip() for key in api_keys_str.split(",") if key.strip()]

async def verify_ingest_key(api_key: str = Security(api_key_header)):
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# --- Routes Include ---
app.include_router(auth.router, prefix="/api/v1")
app.include_router(ingest.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}

@app.on_event("startup")
async def startup_event():
    try:
        udp_thread = threading.Thread(target=syslog_udp_server, daemon=True)
        udp_thread.start()
        print("Started UDP Syslog server.")
    except Exception as e:
        print(f"Failed to start Syslog server: {e}")

    asyncio.create_task(monitor_alerts())