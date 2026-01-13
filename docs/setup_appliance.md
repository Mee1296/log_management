# Log Management Appliance Setup Guide

## Overview
This guide describes how to deploy the Log Management System as a self-contained "Appliance" on a single server using Docker.

## Prerequisites
- Linux Server (Ubuntu 22.04 LTS recommended)
- Docker Engine & Docker Compose
- Minimum Specs: 2 vCPU, 4GB RAM, 50GB Disk

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Mee1296/log_management
   cd log_management
   ```

2. **Configure Environment**
   Create a `.env` file (copied from `.env.example` if available) with secure credentials:
   ```bash
   POSTGRES_USER=log_user
   POSTGRES_PASSWORD=<strong_password>
   POSTGRES_DB=logs_db
   
   ADMIN_USER=admin
   ADMIN_PASS=<strong_password>
   
   VIEWERS_JSON='{"viewerA": {"password": "A123", "tenant": "demoA"},"viewerB": {"password": "B123", "tenant": "demoB"},      "viewerC": {"password": "C123", "tenant": "demoC"}}'

   
   INGEST_API_KEY_NAME=X-API-KEY
   DATABASE_URL=postgresql://log_user:<strong_password>@db:5432/logs_db
   ```

3. **Start the Appliance**
   ```bash
   docker-compose up -d --build
   ```

## Verification
- **Dashboard**: Open `http://localhost`
- **Ingestion (Syslog)**: Send UDP logs to `localhost:514`
- **Ingestion (API)**: POST to `http://localhost/api/v1/ingest`

## Maintenance
- **Logs**: `docker-compose logs -f`
- **Update**: `git pull && docker-compose up --build -d`
- **Backup**: Backup the `postgres_data` volume.
