import os
import psycopg2
import time
from datetime import datetime, timezone

DB_URL = os.getenv("DATABASE_URL")

def cleanup():
    while True:
        try:
            conn = psycopg2.connect(DB_URL)
            cur = conn.cursor()
            cur.execute("DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '7 days';")
            print(f"[{datetime.now(timezone.utc).isoformat()}] Deleted {cur.rowcount} old logs.")
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            print(f"Cleanup Error: {e}")
        
        print("Cleanup completed. Next run in 24 hours.")
        # run every 24 hours
        time.sleep(86400)

if __name__ == "__main__":
    cleanup()