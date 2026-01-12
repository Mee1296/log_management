import os
import psycopg2
from psycopg2.extras import execute_values
import json

DB_URL = os.getenv("DATABASE_URL")

def save_to_db(data):
    if not data:
        return
        
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # กำหนดคอลัมน์มาตรฐานตาม Schema ใน db/init.sql
        standard_columns = [
            'timestamp', 'tenant', 'source', 'vendor', 'product', 'severity', 
            'action', 'event_type', 'event_subtype', 'src_ip', 'dst_ip', 
            'src_port', 'dst_port', 'protocol', 'message', 'user_name', 
            'host', 'process', 'url', 'http_method', 'status_code', 
            'cloud_account_id', 'cloud_region', 'cloud_service', 'raw_data'
        ]

        values = []
        for item in data:
            # ตรวจสอบว่า raw_data เป็น dict หรือไม่ ถ้าใช่ค่อย dumps
            raw = item.get("raw_data")
            if isinstance(raw, (dict, list)):
                raw = json.dumps(raw)
            
            # สร้าง tuple ของข้อมูลตามลำดับ standard_columns เป๊ะๆ
            val_tuple = tuple(item.get(col) for col in standard_columns)
            values.append(val_tuple)
        
        insert_query = f"INSERT INTO logs ({', '.join(standard_columns)}) VALUES %s"
        
        execute_values(cur, insert_query, values)
        
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Error (Batch Insert): {e}")

def save_alert(alert_data):
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        columns = alert_data.keys()
        values = [alert_data[column] for column in columns]
        
        insert_query = f"INSERT INTO alerts ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(values))})"
        
        cur.execute(insert_query, values)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Error (Alert Insert): {e}")

def fetch_from_db(query: str, params: tuple):
    try:
        conn = psycopg2.connect(DB_URL)
        # Dictcursor for fetching results as JSON-like dicts
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query, params)
        results = cur.fetchall()
        cur.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Query Error: {e}")
        return []