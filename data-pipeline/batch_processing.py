import json
import requests
import os

API_URL = "http://localhost:8000/ingest"

def process_sample_files(directory="../samples"):
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            with open(os.path.join(directory, filename), 'r') as f:
                try:
                    logs = json.load(f)
                    # หากไฟล์เป็น List ของ Log ให้วนลูปส่ง
                    if isinstance(logs, list):
                        for entry in logs:
                            source = entry.get("source", "file_batch")
                            requests.post(f"{API_URL}/{source}", json=entry)
                    else:
                        source = logs.get("source", "file_batch")
                        requests.post(f"{API_URL}/{source}", json=logs)
                    print(f"Processed {filename} successfully.")
                except Exception as e:
                    print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    process_sample_files()