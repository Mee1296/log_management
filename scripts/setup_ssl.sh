#!/bin/bash
# scripts/setup_ssl.sh

mkdir -p ../certs

echo "Generating Self-signed Certificate for SaaS mode..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ../certs/server.key \
  -out ../certs/server.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=LogCommander/OU=IT/CN=localhost"

echo "Done! Certificates are located in the certs/ directory."
chmod 600 ../certs/server.key