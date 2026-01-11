# System Design & Architecture Deep Dive

## 1. High-Level Architecture
The system follows a **Microservices-based Architecture** (containerized via Docker), designed for scalability, separation of concerns, and ease of deployment.

### Components
1.  **Ingestion Layer (Nginx + FastAPI)**: The entry point for all data.
2.  **Processing Layer (Parser + Async Workers)**: Normalizes data and handles background tasks.
3.  **Storage Layer (PostgreSQL)**: Relational storage with JSON capabilities for flexible log schemas.
4.  **Presentation Layer (React Frontend)**: Visualizes data and provides user interaction.

---

## 2. Component Details & Design Roadmap

### A. Frontend (The Dashboard)
**Technology**: React, Vite, TailwindCSS (Glassmorphism UI)
**Why this choice?**
-   **React**: Component-based structure makes it easy to build reusable UI elements (e.g., `LogTable`, `SummaryCard`).
-   **Vite**: Extremely fast build tool, improving developer experience compared to Webpack.
-   **TailwindCSS**: Utility-first CSS allows for rapid styling without context switching to CSS files. The "System-UI" font (Inter/Roboto) and Dark Mode provide a compliant, "Cybersecurity Tool" aesthetic.
-   **Architecture**:
    -   Communicates with Backend via REST API (Axios/Fetch).
    -   **State Management**: Uses `useState`/`useEffect` for local state and `localStorage` for session persistence (Token/Role).
    -   **Security**: Disables sensitive inputs (like Tenant ID) client-side for "Viewer" roles to improve UX (though real security is enforced backend).

### B. Backend (The Core)
**Technology**: Python, FastAPI, Pydantic
**Why this choice?**
-   **FastAPI**: One of the fastest Python frameworks (Starlette-based). It provides **Async I/O** out of the box, which is critical for handling high-concurrency log ingestion.
-   **Pydantic**: Data validation is automatic. We define a `LogSchema`, and Pydantic ensures incoming JSON matches strict types before it even hits our logic.
-   **Python**: Huge ecosystem for data processing and potential future ML/AI integration for anomaly detection.
-   **Flow**:
    1.  **Auth**: `api/auth.py` issues simple JWT-like tokens to identify Admin vs. Viewer.
    2.  **Ingest**: `api/ingest.py` receives logs, validates them, and standardizes them.
    3.  **Alerts**: `services/background_tasks.py` runs asynchronously to check patterns (side-car logic).

### C. Database (The Storage)
**Technology**: PostgreSQL 15
**Why this choice?**
-   **Hybrid Power**: Postgres offers standard Relational tables (great for Users, Alerts) AND robust `JSONB` support.
-   **Log Storage Strategy**: We use a `logs` table where structured fields (`timestamp`, `severity`, `source`) are columns (for fast indexing/querying), but the full raw payload is stored in `raw_data` (JSONB). This gives us the query speed of SQL with the flexibility of NoSQL (like ElasticSearch) without the complexity of managing a second database.

### D. Ingestion & Security
**Technology**: Nginx (Reverse Proxy) + RBAC
**Why this choice?**
-   **Nginx**: Handles SSL termination (HTTPS) and acts as a buffer/load balancer. It protects the application server from direct internet exposure.
-   **RBAC (Role-Based Access Control)**:
    -   **Multi-tenancy**: The core requirement. A "Viewer" is tied to a `tenant_id`.
    -   **Enforcement**: Every Data Access Object (DAO) or SQL query in the backend checks: `WHERE tenant = user_assigned_tenant`. This ensures data isolation at the database query level, impossible to bypass via UI manipulation.

---

## 3. System Flow Examples

### Flow 1: Log Ingestion (The Data Pipeline)
1.  **Source** (e.g., Firewall, AWS) sends JSON/Syslog to `https://log-server/api/v1/ingest/aws`.
2.  **Nginx** receives encrypted traffic, decrypts (SSL), and forwards to **FastAPI** container.
3.  **FastAPI** (`ingest.py`) validates the API Key.
4.  **Parser** (`services/parser.py`) detects the source type (AWS vs M365) and maps fields (e.g., `eventName` -> `event_type`).
5.  **DB Writer**: Normalized dict is inserted into **PostgreSQL**.
6.  **Alert Check**: (Async) If Severity >= 8, an Alert is immediately written to the `alerts` table.

### Flow 2: Threat Detection (The "Smart" Part)
1.  **Background Task** (`main.py` -> `monitor_alerts`) wakes up every 60 seconds.
2.  **Query**: executes a SQL aggregation: `SELECT src_ip FROM logs WHERE event='login_failed' ... GROUP BY src_ip HAVING count > 5`.
3.  **Trigger**: If rows are returned, it writes a new row to `alerts` table and could theoretically email/webhook the admin.

### Flow 3: User Investigation (The UX)
1.  **Admin** logs in. Backend returns `role: admin`.
2.  **Admin** sees "Alerts" tab showing "Brute Force from 10.0.0.1".
3.  **Admin** switches to Dashboard, filters by `Source IP: 10.0.0.1`.
4.  **Backend** executes `SELECT * FROM logs WHERE src_ip = '10.0.0.1'`.
5.  **Result**: Admin sees the exact timeline of the attack.

---

## 4. Why this stack for an Intern Exam/MVP?
-   **Low Overhead**: Docker Compose allows bringing up the whole stack with one command. No complex K8s or external cloud deps needed.
-   **Clarity**: Python code is readable, making logic easy to audit.
-   **Extensibility**: Adding a new source is just adding a 5-line `if/else` in the Parser.
