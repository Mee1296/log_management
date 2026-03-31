# LogSync - Design Decisions & Rationale

## 1. JSON-Only Data Stream
**Decision:** Deprecate support for unstructured plaintext (Syslog RFC 3164/5424) in favor of structured JSON payloads.
**Rationale:**
- **Complexity:** Plaintext parsing (regex) is error-prone and brittle.
- **Modernity:** Cloud-native tools (AWS, Azure, M365) already emit structured data.
- **Performance:** JSON parsing is faster and more reliable, allowing for strict Pydantic validation.
- **Impact:** Simpler code, fewer parsing bugs, and cleaner database ingestion.

## 2. Asynchronous Architecture (FastAPI + SQLAlchemy + asyncpg)
**Decision:** Shift from synchronous `psycopg2` to an asynchronous engine with connection pooling.
**Rationale:**
- **I/O Bound:** Log ingestion is highly I/O bound. Synchronous drivers block the event loop, causing latency spikes.
- **Scalability:** `asyncpg` combined with SQLAlchemy's connection pooling allows the system to handle thousands of concurrent ingestion requests with minimal overhead.
- **Consistency:** All background tasks (Alerting, Retention) are now part of the same async ecosystem.

## 3. JWT-Based Security & RBAC
**Decision:** Replace simple tokens with cryptographically signed JSON Web Tokens (JWT).
**Rationale:**
- **Security:** JWTs are stateless and more secure than simple ID-based tokens.
- **Statelessness:** No need to store sessions in the database for every user.
- **Standardization:** Follows industry-standard OAuth2/JWT flows, making it compatible with more clients.

## 4. Modern-Plain UI Aesthetic
**Decision:** Redesign the dashboard with a "Graph-Centric" layout and a "White, Black, and Dark Purple" color palette.
**Rationale:**
- **Clarity:** The previous "Neon/Dark" theme was visually distracting. The "Modern-Plain" aesthetic emphasizes the data (the largest element is the graph).
- **Professionalism:** High-contrast, clean lines provide a professional "SaaS" feel.
- **UX:** Using the "Inter" font and ample white space makes scanning long logs significantly easier for the user.

## 5. Automated Data Lifecycle
**Decision:** Implement automated background tasks for Alert Monitoring and Data Retention.
**Rationale:**
- **Security:** Brute-force detection shouldn't wait for a human to look at the screen.
- **Performance:** The 7-day retention policy keeps the `logs` table lean, preventing query degradation over time.
- **Efficiency:** Running these as async sidecar tasks ensures they don't impact the responsiveness of the main API.

## 6. PostgreSQL Hybrid Storage
**Decision:** Use a structured relational table with a `JSONB` raw data blob.
**Rationale:**
- **Searchability:** Fields like `timestamp`, `source`, and `severity` are indexed for ultra-fast dashboard queries.
- **Flexibility:** `JSONB` allows us to store the full, unmapped source data without losing any context.
- **Maintainability:** Relational tables for Users and Alerts provide strict consistency where it matters most.
