from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, ingest

app = FastAPI()

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

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}
