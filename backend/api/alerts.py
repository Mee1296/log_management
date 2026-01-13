from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user, User
from db.repository import fetch_from_db

router = APIRouter()

@router.get("/alerts")
async def get_alerts(
    start_date: str = None, 
    end_date: str = None, 
    user: User = Depends(get_current_user), 
    limit: int = 50
):
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    
    # RBAC Filter
    if user.role != "admin":
        query += " AND tenant = %s"
        params.append(user.tenant_access)

    # Time Filter
    if start_date:
        query += " AND timestamp >= %s"
        params.append(start_date)
    if end_date:
        query += " AND timestamp <= %s"
        params.append(end_date)
        
    query += " ORDER BY timestamp DESC LIMIT %s"
    params.append(limit)
    
    return fetch_from_db(query, tuple(params))
