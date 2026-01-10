from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user, User
from db.repository import fetch_from_db

router = APIRouter()

@router.get("/alerts")
async def get_alerts(user: User = Depends(get_current_user), limit: int = 50):
    query = "SELECT * FROM alerts"
    params = []
    
    # RBAC Filter
    if user.role != "admin":
        # Viewer sees only their tenant
        query += " WHERE tenant = %s"
        params.append(user.tenant_access)
    else:
        # Admin can see all, maybe add optional filter later
        pass
        
    query += " ORDER BY timestamp DESC LIMIT %s"
    params.append(limit)
    
    return fetch_from_db(query, tuple(params))
