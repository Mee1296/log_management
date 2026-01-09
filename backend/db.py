from fastapi import FastAPI, Request, HTTPException, Query
import os
import psycopg2
from parser import parse_log, parse_syslog_text
from psycopg2.extras import execute_values
import json

DB_URL = os.getenv("DATABASE_URL")

def save_to_db(normalized_data):
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        if isinstance(normalized_data.get("raw_data"), dict):
            normalized_data["raw_data"] = json.dumps(normalized_data["raw_data"])

        columns = normalized_data.keys()
        values = [normalized_data[column] for column in columns]
        
        insert_query = f"INSERT INTO logs ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(values))})"
        
        cur.execute(insert_query, values)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Error (JSONB Issue?): {e}")

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