from fastapi import APIRouter, HTTPException, Request, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import os
import json
import bcrypt

from db.repository import save_alert, fetch_user, register_user

router = APIRouter()

# --- Config from Env ---
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "admin123")


# Security Thresholds 
MAX_FAILURES = int(os.getenv("AUTH_MAX_FAILURES", "3"))
WINDOW_MINUTES = int(os.getenv("AUTH_WINDOW_MINUTES", "5"))
BLOCK_HOURS = int(os.getenv("AUTH_BLOCK_HOURS", "1"))

# API Key Config 
API_KEY_NAME = os.getenv("INGEST_API_KEY_NAME", "X-API-KEY")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

api_keys_str = os.getenv("INGEST_API_KEYS", "") 
VALID_API_KEYS = [key.strip() for key in api_keys_str.split(",") if key.strip()]

# Users are loaded dynamically from DB
try:
    pass
except Exception as e:
    print(f"Error initializing auth: {e}")

async def verify_ingest_key(api_key: str = Security(api_key_header)):
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# --- Brute Force Protection (In-Memory) ---
failed_logins: dict[str, list[datetime]] = {}
blocked_ips: dict[str, datetime] = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    tenant: str
    email: str

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

    if token_val.endswith("-token"):
        username = token_val.replace("-token", "")
        # Dynamically fetch user check
        user_info = fetch_user(username)
        if user_info:
             return User(username=username, role="viewer", tenant_access=user_info["tenant"])

    raise HTTPException(status_code=401, detail="Invalid Token")

def get_client_ip(request: Request):
    return request.client.host

def cleanup_old_failures(ip: str):
    if ip in failed_logins:
        now = datetime.now()
        window_start = now - timedelta(minutes=WINDOW_MINUTES)
        failed_logins[ip] = [t for t in failed_logins[ip] if t > window_start]
        if not failed_logins[ip]:
            del failed_logins[ip]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False

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
            del blocked_ips[ip] # Expired
            if ip in failed_logins: del failed_logins[ip]

    # 2. Verify Credentials
    if creds.username == ADMIN_USER and creds.password == ADMIN_PASS:
        if ip in failed_logins: del failed_logins[ip]
        if ip in blocked_ips: del blocked_ips[ip]
        return { "status": "success", "token": "admin-token", "role": "admin", "tenant_id": "*", "tenant_access": "*" }

    user_info = fetch_user(creds.username)
    if user_info:
        stored_hash = user_info.get("password_hash", "")
        if verify_password(creds.password, stored_hash):
            if ip in failed_logins: del failed_logins[ip]
            if ip in blocked_ips: del blocked_ips[ip]
            return { "status": "success", "token": f"{creds.username}-token", "role": "viewer", "tenant_id": user_info["tenant"], "tenant_access": user_info["tenant"] }

    # 3. Handle Failure
    cleanup_old_failures(ip)
    
    if ip not in failed_logins:
        failed_logins[ip] = []
    
    failed_logins[ip].append(now)
    
    # Check threshold
    if len(failed_logins[ip]) >= MAX_FAILURES: 
        blocked_ips[ip] = now + timedelta(hours=BLOCK_HOURS)
        
        print(f"[SECURITY] Blocking IP {ip} due to brute force.")
        try:
            save_alert({
                "timestamp": datetime.now(timezone.utc),
                "severity": 10, # Critical
                "message": f"Brute force attack blocked from IP: {ip}",
                "source": "auth_system",
                "tenant": "system"
            }) 
        except Exception as e:
            print(f"Failed to save alert: {e}")

        raise HTTPException(
            status_code=403,
            detail=f"Too many failed attempts. Access blocked for {BLOCK_HOURS} hour."
        )

    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register")
async def register(creds: RegisterRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can register new users")
    
    if fetch_user(creds.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    try:
        hashed_password = hash_password(creds.password)
        register_user(tenant=creds.tenant, username=creds.username, password_hash=hashed_password, email=creds.email)
        return { "status": "success", "message": f"User {creds.username} registered successfully for tenant {creds.tenant}." }
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")