from fastapi import FastAPI, Request, HTTPException
import psycopg2
import os
import datetime
import threading
import socket
from parser import parse_log, parse_syslog_text
from psycopg2.extras import execute_values

app = FastAPI()

DB_URL = os.getenv("DATABASE_URL")

@app.get("/")
def root():
    return {"status": "running", "protocol": ["HTTP", "UDP/514"]}

# @app.get()

    
@app.post("/ingest/{source_type}")
async def ingest_logs(source_type: str, request: Request):
    data = await request.json()
    
    tenant = data.get("tenant") or request.headers.get("X-Tenant-ID")
    if not tenant:
        raise HTTPException(status_code=400, detail="Missing tenant information")

    parsed = parse_log(data, source_type) 
    save_to_db(parsed) 
    return {"status": "stored", "data": parsed}

def save_to_db(normalized_data):
    columns = normalized_data.keys()
    values = [normalized_data[col] for col in columns]
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        query = f"INSERT INTO logs ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(columns))})"
        
        cur.execute(query, values)
        conn.commit()
    except Exception as e:
        print(f"DB Error: {e}")

def syslog_udp_server():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 514))
    print("UDP Syslog Server listening on port 514...")
    
    while True:
        data, addr = sock.recvfrom(4096)
        raw_msg = data.decode('utf-8', errors='ignore')
        print(f"UDP Received: {raw_msg}")
        
        try:
            parsed_data = parse_syslog_text(raw_msg)
            if not parsed_data.get("tenant"):
                parsed_data["tenant"] = "default"            
            save_to_db(parsed_data)
        except Exception as e:
            print(f"UDP Processing Error: {e}")    

try:
    udp_thread = threading.Thread(target=syslog_udp_server, daemon=True)
    udp_thread.start()
    print("Started UDP Syslog server thread.")
except Exception as e:
    print(f"Failed to start UDP server thread: {e}")