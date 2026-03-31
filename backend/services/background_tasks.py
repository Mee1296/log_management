import asyncio
from datetime import datetime, timedelta, timezone
from db.repository import fetch_from_db, save_alert

async def monitor_alerts():
    print("Starting Alert Monitor...")
    while True:
        try:
            # Query: > 5 failed logins from same IP in last 5 minutes
            query = """
                SELECT src_ip, count(*) as count
                FROM logs 
                WHERE event_type = 'login_failed' 
                AND timestamp > NOW() - INTERVAL '5 minutes' 
                GROUP BY src_ip 
                HAVING count(*) > 5
            """
            results = await fetch_from_db(query)
            
            for res in results:
                src_ip = res.get('src_ip')
                count = res.get('count')
                
                alert_msg = f"Brute Force Detected: {src_ip} ({count} fails)"
                await save_alert({
                    "timestamp": datetime.now(timezone.utc),
                    "severity": 9,
                    "message": alert_msg,
                    "source": "system_monitor",
                    "tenant": "default"
                })
                print(f"[ALERT] Generated for {src_ip}")
                
        except Exception as e:
            print(f"Alert Monitor Error: {e}")
            
        await asyncio.sleep(60)
