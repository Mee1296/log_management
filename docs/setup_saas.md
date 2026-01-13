# Log Management SaaS Setup Guide

## Overview
This guide adds HTTPS (TLS) and Multi-tenancy configurations for running the system as a SaaS platform.

## HTTPS Configuration (TLS)

1. **Generate Certificates**
   Run the following command to generate self-signed certificates for testing:
   ```bash
   cd scipts && chmod +X *.sh
   ./setup_ssl.sh
   docker-compose up -d
   ```

2. **Update Configuration**
   Ensure `docker-compose.yml` mounts the certs:
   ```yaml
   volumes:
     - ./certs:/etc/nginx/certs:ro
   ```
   Ensure `nginx.conf` listens on 443 ssl (already configured in codebase).

3. **Restart**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Multi-Tenancy Strategy
The system enforces strict multi-tenancy via **RBAC**:
- **Ingestion**: Every log MUST include a `tenant` field or `X-Tenant-ID` header.
- **Access**: 
  - Admin: Can view all tenants (`tenant_access: *`).
  - Viewers: Can ONLY view their assigned tenant. (Blocked dynamically by API).

## Scaling
For high-volume SaaS:
1. Move `db` service to a dedicated managed PostgreSQL instance (RDS/CloudSQL).
2. Run multiple `backend` replicas and use a Load Balancer.
3. Use a Queue (Kafka/Redis) before `ingest.py` processing for buffering.
