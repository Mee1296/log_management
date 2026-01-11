from fastapi import APIRouter, HTTPException, Request, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from datetime import datetime, timedelta
import os

router = APIRouter()

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "admin")
VIEWER_USER = os.getenv("VIEWER_USER", "viewer")
VIEWER_PASS = os.getenv("VIEWER_PASS", "viewer")
VIEWER_TENANT = os.getenv("VIEWER_TENANT", "demo") # Default tenant for viewer

# Ingest API Key Config
API_KEY_NAME = os.getenv("INGEST_API_KEY_NAME", "DEFAULT_INGEST_KEY")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
VALID_API_KEYS = ["secret-key-123", "admin-key"]

async def verify_ingest_key(api_key: str = Security(api_key_header)):
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# In-memory stores
# IP -> List of failure timestamps
failed_logins: dict[str, list[datetime]] = {}
# IP -> Unblock time
blocked_ips: dict[str, datetime] = {}

MAX_FAILURES = 3
WINDOW_MINUTES = 5
BLOCK_HOURS = 1

class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    role: str
    tenant_access: str 

async def get_current_user(token: str = Depends(APIKeyHeader(name="Authorization", auto_error=False))):
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing Token")
    
    token_val = token.replace("Bearer ", "")
    
    if token_val == "admin-token":
        return User(username=ADMIN_USER, role="admin", tenant_access="*")
    elif token_val == "viewer-token":
        return User(username=VIEWER_USER, role="viewer", tenant_access=VIEWER_TENANT)
    else:
         raise HTTPException(status_code=401, detail="Invalid Token")

def get_client_ip(request: Request):
    return request.client.host

def cleanup_old_failures(ip: str):
    if ip in failed_logins:
        now = datetime.now()
        window_start = now - timedelta(minutes=WINDOW_MINUTES)
        # Keep only failures within the window
        failed_logins[ip] = [t for t in failed_logins[ip] if t > window_start]
        if not failed_logins[ip]:
            del failed_logins[ip]

@router.post("/login")
async def login(creds: LoginRequest, request: Request):
    ip = get_client_ip(request)
    now = datetime.now()

    # 1. Check if blocked
    if ip in blocked_ips:
        if now < blocked_ips[ip]:
            remaining = int((blocked_ips[ip] - now).total_seconds() / 60)
            raise HTTPException(
                status_code=403, 
                detail=f"Access blocked due to multiple failed attempts. Try again in {remaining} minutes."
            )
        else:
            # Block expired
            del blocked_ips[ip]
            if ip in failed_logins:
                del failed_logins[ip]

    # 2. Verify Credentials
    # 2. Verify Credentials
    if creds.username == ADMIN_USER and creds.password == ADMIN_PASS:
        # Success: Clean up failures
        if ip in failed_logins:
            del failed_logins[ip]
        if ip in blocked_ips:
            del blocked_ips[ip]
        return {
            "status": "success", 
            "token": "admin-token", 
            "role": "admin", 
            "tenant_id": "*",
            "tenant_access": "*"
        }

    if creds.username == VIEWER_USER and creds.password == VIEWER_PASS:
         if ip in failed_logins:
            del failed_logins[ip]
         if ip in blocked_ips:
            del blocked_ips[ip]
         return {
            "status": "success", 
            "token": "viewer-token", 
            "role": "viewer", 
            "tenant_id": VIEWER_TENANT,
            "tenant_access": VIEWER_TENANT
        }

    # 3. Handle Failure
    cleanup_old_failures(ip)
    
    if ip not in failed_logins:
        failed_logins[ip] = []
    
    failed_logins[ip].append(now)
    
    # Check threshold
    if len(failed_logins[ip]) > MAX_FAILURES:
        blocked_ips[ip] = now + timedelta(hours=BLOCK_HOURS)
        raise HTTPException(
            status_code=403,
            detail="Too many failed attempts. Access blocked for 1 hour."
        )

    raise HTTPException(status_code=401, detail="Invalid credentials")
