import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from datetime import datetime, timezone

# Convert postgres:// to postgresql+asyncpg:// if needed
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")
if DB_URL.startswith("postgresql://"):
    ASYNC_DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_DB_URL = DB_URL # Fallback or already correct

engine = create_async_engine(ASYNC_DB_URL, pool_size=20, max_overflow=10)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def save_to_db(data):
    if not data:
        return
        
    async with AsyncSessionLocal() as session:
        standard_columns = [
            'timestamp', 'tenant', 'source', 'vendor', 'product', 'severity', 
            'action', 'event_id', 'event_type', 'event_subtype', 'src_ip', 'dst_ip', 
            'src_port', 'dst_port', 'protocol', 'message', 'user_name', 
            'host', 'process', 'url', 'http_method', 'status_code', 
            'cloud_account_id', 'cloud_region', 'cloud_service', 'raw_data'
        ]

        # Preparing batch insert with SQLAlchemy text()
        cols_str = ", ".join(standard_columns)
        placeholders = ", ".join([f":{col}" for col in standard_columns])
        insert_query = text(f"INSERT INTO logs ({cols_str}) VALUES ({placeholders})")

        try:
            prepared_data = []
            for item in data:
                current_item = {col: item.get(col) for col in standard_columns}
                
                raw = item.get("raw_data")
                if isinstance(raw, (dict, list)):
                    current_item["raw_data"] = json.dumps(raw)
                
                prepared_data.append(current_item)
            
            await session.execute(insert_query, prepared_data)
            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"DB Error (Async Batch Insert): {e}")

async def save_alert(alert_data):
    async with AsyncSessionLocal() as session:
        columns = list(alert_data.keys())
        cols_str = ", ".join(columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        insert_query = text(f"INSERT INTO alerts ({cols_str}) VALUES ({placeholders})")
        
        try:
            await session.execute(insert_query, alert_data)
            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"DB Error (Alert Insert): {e}")

async def fetch_from_db(query: str, params: dict = None):
    async with AsyncSessionLocal() as session:
        try:
            # Convert %s style to :param style for SQLAlchemy if needed, 
            # but for now we assume incoming query is already SQLAlchemy-friendly or we wrap it.
            # Let's wrap raw SQL
            result = await session.execute(text(query), params or {})
            return [dict(row._mapping) for row in result]
        except Exception as e:
            print(f"Query Error: {e}")
            return []
    
async def register_user(tenant: str, username: str, password_hash: str, email: str, role: str = 'viewer'):
    async with AsyncSessionLocal() as session:
        insert_query = text("INSERT INTO users (tenant, username, password_hash, email, role) VALUES (:tenant, :username, :password_hash, :email, :role)")
        try:
            await session.execute(insert_query, {
                "tenant": tenant, 
                "username": username, 
                "password_hash": password_hash, 
                "email": email,
                "role": role
            })
            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"User Registration Error: {e}")

async def fetch_user(username: str):
    async with AsyncSessionLocal() as session:
        select_query = text("SELECT * FROM users WHERE username = :username")
        try:
            result = await session.execute(select_query, {"username": username})
            row = result.fetchone()
            return dict(row._mapping) if row else None
        except Exception as e:
            print(f"Fetch User Error: {e}")
            return None
