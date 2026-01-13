#!/bin/bash
docker-compose down -v
docker-compose up -d --build
echo "System restarted with clean database."