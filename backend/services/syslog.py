import socket
from parser import parse_syslog_text
from db.repository import save_to_db
import threading

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