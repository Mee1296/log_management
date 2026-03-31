import socket
import json
from services.parser import parse_log
from db.repository import save_to_db

def syslog_udp_server():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 514))
    print("UDP Syslog Server listening on port 514 (JSON Only)...")
    
    while True:
        data, addr = sock.recvfrom(4096)
        raw_msg = data.decode('utf-8', errors='ignore')
        
        try:
            # Expecting JSON via UDP
            parsed_data = parse_log(raw_msg, "syslog")
            if not parsed_data.get("tenant"):
                parsed_data["tenant"] = "default"            
            save_to_db([parsed_data])
        except Exception as e:
            print(f"UDP Processing Error (Invalid JSON?): {e}")