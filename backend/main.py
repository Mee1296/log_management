from fastapi import FastAPI, Request, HTTPException
import psycopg2
import os
import datetime
import threading
import socket
from parser import parse_log
from psycopg2.extras import execute_values

app = FastAPI()

# ดึงค่าจาก Docker Compose env
DB_URL = os.getenv("DATABASE_URL")

def save_to_db(normalized_data):
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # insert log into database
        columns = normalized_data.keys()
        values = [normalized_data[column] for column in columns]
        insert_query = f"INSERT INTO logs ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(values))})"
        
        cur.execute(insert_query, values)
        conn.commit()
        cur.close()
        conn.close()
        print("Successfully saved log to DB.")
    except Exception as e:
        print(f"DB Error: {e}")

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}

    
@app.post("/ingest/{source_type}")
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    tenant = data.get("tenant") or request.headers.get("X-Tenant-ID")
    if not tenant:
        raise HTTPException(status_code=400, detail="Missing tenant information")

    normalized_data = {
        "timestamp": data.get("@timestamp", datetime.datetime.now().isoformat()),
        "tenant": tenant,
        "source": source_type,
        "event_type": data.get("event_type"),
        "severity": data.get("severity", 5),
        "user_name": data.get("user") or data.get("user_name"),
        "raw_data": data 
    }

    data = await request.json()
    parsed = parse_log(data, source_type) 
    save_to_db(parsed) 
    return {"status": "stored", "data": parsed}

def syslog_udp_server():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 514))
    print("UDP Syslog Server listening on port 514...")
    
    while True:
        data, addr = sock.recvfrom(4096)
        raw_msg = data.decode('utf-8', errors='ignore')
        
        parsed = parse_log(raw_msg, "firewall") 
        save_to_db(parsed) 
        

threading.Thread(target=syslog_udp_server, daemon=True).start()