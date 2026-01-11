from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, ingest, alerts
import asyncio
from services.background_tasks import monitor_alerts

app = FastAPI()

# Background Task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_alerts())

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify allowed origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(ingest.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}
