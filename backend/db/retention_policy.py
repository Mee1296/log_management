import os
import asyncio
from datetime import datetime, timezone
from db.repository import AsyncSessionLocal
from sqlalchemy import text

async def cleanup():
    print("Starting Log Retention Cleanup Task...")
    while True:
        try:
            async with AsyncSessionLocal() as session:
                query = text("DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '7 days';")
                result = await session.execute(query)
                await session.commit()
                print(f"[{datetime.now(timezone.utc).isoformat()}] Deleted {result.rowcount} old logs.")
        except Exception as e:
            print(f"Cleanup Error: {e}")
        
        # run every 24 hours
        await asyncio.sleep(86400)

if __name__ == "__main__":
    # If run directly for testing/standalone
    asyncio.run(cleanup())
