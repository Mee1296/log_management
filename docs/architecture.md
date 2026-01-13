# Log Management System - Architecture & Guide

## System Overview
This is a comprehensive Log Management System designed to ingest, parse, store, and visualize log data from multiple sources (Syslog, API, CloudTrail, etc.). It features a modern React Dashboard and a FastAPI backend with PostgreSQL storage.

## Architecture
The system follows a microservices-style architecture composed of Docker containers:

1. **Frontend (`frontend/`)**
   - **Stack**: React, Vite, TailwindCSS (Dark Mode/Glassmorphism).
   - **Role**: Visualizes log data, provides search interface.
   - **Security**: Authenticated via JWT-like Tokens (Admin/Viewer roles).

2. **Backend (`backend/`)**
   - **Stack**: Python, FastAPI, Pydantic, Psycopg2.
   - **Role**: 
     - API Layer (`/api/v1`): Handles Login, Search, and Stats.
     - Ingestion Layer: Receives logs via HTTP (`POST /api/v1/ingest`) or UDP Syslog (Port 514).
     - RBAC: Enforces role-based access control (Admin vs Viewer).

3. **Database (`db/`)**
   - **Stack**: PostgreSQL 15.
   - **Role**: specific `JSONB` storage for normalized logs.

4. **Services**
   - **Simulator (`samples/simulator.py`)**: Generates traffic (API, AWS, M365, Syslog) for testing.
   - **Retention Policy (`backend/db/retention_policy.py`)**: runs as a sidecar to clean old logs.
   - **Alert Monitor (`backend/services/background_tasks.py`)**: Background task that aggregates logs every minute to detect threats (e.g., Brute Force).

## Security & RBAC
The system implements strict access control:

- **Authentication**: Credentials stored in Environment Variables (or `.env`).
- **Roles**:
  - **Admin**: Full Access. Can search any tenant.
  - **Viewer**: Restricted Access. Can ONLY view their assigned tenant. API will Block (403) any attempt to access other tenants.
- **Protection**:
  - **Rate Limiting**: >3 Failed Logins in 5 mins -> **IP Blocked for 1 Hour**.
  - **Secure Secrets**: Secrets are loaded from `.env` and not hardcoded.

## API Usage
### Login
`POST /api/v1/login`
```json
{ "username": "admin", "password": "..." }
```
Returns: `{ "token": "...", "role": "admin", "tenant_access": "*" }`

### Ingest
`POST /api/v1/ingest/{source_type}`
Headers: `Authorization: Bearer <INGEST_KEY>`

## How to Run
1. **Secrets**: Ensure `.env` exists with `POSTGRES_PASSWORD`, `ADMIN_USER`, etc.
2. **Start**: `docker-compose up -d --build`
3. **Access**: `http://localhost:`

## Testing
- **Frontend**: `cd /frontend -> npm test` (Vitest)
- **Backend**: `pytest` (API tests)
