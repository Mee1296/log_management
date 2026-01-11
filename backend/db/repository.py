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
        
        # Normalize to list
        if not isinstance(data, list):
            data = [data]
            
        if not data:
            return

        # Prepare payload
        # Ensure json dumping for raw_data if needed
        for item in data:
            if isinstance(item.get("raw_data"), dict):
                item["raw_data"] = json.dumps(item["raw_data"])
        
        # Assume all items have same keys as first one
        columns = list(data[0].keys())
        # Create list of tuples for values
        values = [[item.get(col) for col in columns] for item in data]
        
        insert_query = f"INSERT INTO logs ({', '.join(columns)}) VALUES %s"
        
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