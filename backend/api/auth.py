from fastapi import APIRouter, HTTPException, Request, Depends, Security
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import os
from jose import JWTError, jwt
from passlib.context import CryptContext

from db.repository import save_alert, fetch_user, register_user

router = APIRouter()

# --- Config ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "600"))

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "admin123")

MAX_FAILURES = int(os.getenv("AUTH_MAX_FAILURES", "3"))
WINDOW_MINUTES = int(os.getenv("AUTH_WINDOW_MINUTES", "5"))
BLOCK_HOURS = int(os.getenv("AUTH_BLOCK_HOURS", "1"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login")

# In-Memory Security
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

# API Key Config 
API_KEY_NAME = os.getenv("INGEST_API_KEY_NAME", "X-API-KEY")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

api_keys_str = os.getenv("INGEST_API_KEYS", "") 
VALID_API_KEYS = [key.strip() for key in api_keys_str.split(",") if key.strip()]

async def verify_ingest_key(api_key: str = Security(api_key_header)):
    if not VALID_API_KEYS: # If no keys configured, allow all (for dev) or block?
         return api_key
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        tenant: str = payload.get("tenant")
        if username is None:
            raise credentials_exception
        return User(username=username, role=role, tenant_access=tenant)
    except JWTError:
        raise credentials_exception

def get_client_ip(request: Request):
    return request.client.host

def cleanup_old_failures(ip: str):
    if ip in failed_logins:
        now = datetime.now()
        window_start = now - timedelta(minutes=WINDOW_MINUTES)
        failed_logins[ip] = [t for t in failed_logins[ip] if t > window_start]
        if not failed_logins[ip]:
            del failed_logins[ip]

@router.post("/login")
async def login(creds: LoginRequest, request: Request):
    ip = get_client_ip(request)
    now = datetime.now()

    if ip in blocked_ips:
        if now < blocked_ips[ip]:
            remaining = int((blocked_ips[ip] - now).total_seconds() / 60)
            raise HTTPException(status_code=403, detail=f"Blocked. Try again in {remaining}m.")
        else:
            del blocked_ips[ip]

    user_found = False
    role = ""
    tenant = ""

    # Check Admin (Env based)
    if creds.username == ADMIN_USER and creds.password == ADMIN_PASS:
        user_found = True
        role = "admin"
        tenant = "*"
    else:
        # Check DB
        db_user = await fetch_user(creds.username)
        if db_user and pwd_context.verify(creds.password, db_user["password_hash"]):
            user_found = True
            role = db_user.get("role", "viewer")
            tenant = db_user["tenant"]

    if user_found:
        if ip in failed_logins: del failed_logins[ip]
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": creds.username, "role": role, "tenant": tenant},
            expires_delta=access_token_expires
        )
        return {
            "status": "success", 
            "token": access_token, 
            "role": role, 
            "tenant_access": tenant,
            "tenant_id": tenant
        }

    # Handle Failure
    cleanup_old_failures(ip)
    if ip not in failed_logins: failed_logins[ip] = []
    failed_logins[ip].append(now)
    
    if len(failed_logins[ip]) >= MAX_FAILURES: 
        blocked_ips[ip] = now + timedelta(hours=BLOCK_HOURS)
        await save_alert({
            "timestamp": datetime.now(timezone.utc),
            "severity": 10,
            "message": f"Brute force blocked: {ip}",
            "source": "auth",
            "tenant": "system"
        })
        raise HTTPException(status_code=403, detail="Too many attempts. Blocked.")

    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register")
async def register(creds: RegisterRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    if await fetch_user(creds.username):
        raise HTTPException(status_code=400, detail="User exists")
    
    hashed = pwd_context.hash(creds.password)
    await register_user(tenant=creds.tenant, username=creds.username, password_hash=hashed, email=creds.email)
    return {"status": "success"}
