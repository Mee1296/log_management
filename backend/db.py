from fastapi import FastAPI, Request, HTTPException, Query
import os
import psycopg2
from parser import parse_log, parse_syslog_text
from psycopg2.extras import execute_values

DB_URL = os.getenv("DATABASE_URL")

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