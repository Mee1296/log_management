# LogSync - System Architecture

## System Overview
LogSync (LogPurple) is a high-performance, asynchronous Log Management System designed to ingest, parse, store, and visualize JSON log data from multiple sources (Cloud, Network, Host). It features a professional React Dashboard and a FastAPI backend with optimized PostgreSQL storage.

## The 7-Layer Architecture

### 1. Ingestion Layer (The Gateway)
The entry point for all log data. It supports two main protocols:
*   **HTTP API (Port 8000):** Modern RESTful ingestion for cloud services (AWS, M365). Requires a secure **X-API-KEY** in the request header.
*   **UDP Server (Port 514):** Lightweight listener for network devices. Optimized for **JSON-only** payloads to ensure consistency and speed.

### 2. Processing Layer (The Brain)
Responsible for turning raw data into actionable insights:
*   **Validation:** Uses **Pydantic Schemas** to enforce data integrity (Timestamp, Source, Severity).
*   **Normalization:** Converts varied source formats into a standardized UTC schema.
*   **Real-time Alerting:** Automatically detects high-severity events (Severity >= 7) and creates immediate alerts.

### 3. Storage Layer (The Memory)
Designed for scalability and rapid retrieval:
*   **PostgreSQL 15:** Uses a hybrid schema (Structured columns + `JSONB` for raw blobs).
*   **Async Connection Pooling:** Powered by **SQLAlchemy + asyncpg**. This allows the system to handle high-concurrency ingestion without database bottlenecks.

### 4. Security & RBAC Layer (The Guard)
Ensures data privacy and system integrity:
*   **JWT Authentication:** Uses cryptographically signed JSON Web Tokens for user sessions.
*   **Tenant Isolation:** Strict "Row-Level" style isolation ensures Viewers can only see their assigned logs.
*   **Brute-Force Protection:** Automated IP blocking for repeated failed login attempts.

### 5. Background Services (The Workers)
Silent processes that maintain system health:
*   **Alert Monitor:** An async task that scans for patterns (e.g., brute force attacks) every 60 seconds.
*   **Retention Policy:** An automated task that purges logs older than 7 days every 24 hours.

### 6. Presentation Layer (The Dashboard)
A "Modern-Plain" UI built with **React & Tailwind CSS**:
*   **Graph-Centric Layout:** Prioritizes large timeline analytics for immediate situational awareness.
*   **Live Stream:** Real-time event table with filtering and search.
*   **Palette:** Professional "White, Black, and Dark Purple" aesthetic.

### 7. Simulation Layer (The Tester)
*   **Simulator (`samples/simulator.py`):** Generates realistic traffic (AWS, M365, AD) to validate the entire pipeline end-to-end.

## Tech Stack Summary
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Python 3.11, FastAPI, SQLAlchemy (Async), Pydantic, Jose (JWT), Passlib (Bcrypt).
- **Database:** PostgreSQL 15.
- **Infrastructure:** Docker, Docker Compose.
