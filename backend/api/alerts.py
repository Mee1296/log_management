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
    query = "SELECT * FROM alerts"
    params = {"limit": limit}
    conditions = []
    
    # RBAC Filter
    if user.role != "admin" and user.tenant_access != "*":
        conditions.append("tenant = :tenant")
        params["tenant"] = user.tenant_access

    # Time Filter
    if start_date:
        conditions.append("timestamp >= :start_date")
        params["start_date"] = start_date
    if end_date:
        conditions.append("timestamp <= :end_date")
        params["end_date"] = end_date
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY timestamp DESC LIMIT :limit"
    
    return await fetch_from_db(query, params)
