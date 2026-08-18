# CarbonRoute Production Deployment Guide

## 1. Overview
The CarbonRoute platform is designed to be hosted publicly on a Linux VPS (Ubuntu/Debian), cloud VM (AWS EC2 / GCP Compute Engine / DigitalOcean), or a container orchestrator (Docker Compose / Kubernetes).

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
| Browser (Public Visitor / University Evaluator / Admin)     |
+-------------------------------------------------------------+
                              | HTTPS (Port 443)
                              v
+-------------------------------------------------------------+
| Nginx Reverse Proxy / SSL Termination                       |
+-------------------------------------------------------------+
         |                                           |
         v (Static assets)                           v (/api & /uploads)
+------------------------------------+   +------------------------------------+
| Frontend React Single-Page App     |   | Backend Express Server (Node.js)   |
+------------------------------------+   +------------------------------------+
                                                           |
                                 +-------------------------+-------------------------+
                                 |                                                   |
                                 v                                                   v
                  +-----------------------------+                     +-----------------------------+
                  | Database (JSON / SQLite /   |                     | Object Storage (AWS S3 /    |
                  | PostgreSQL Relational Store)|                     | Cloudflare R2 / Local Disk) |
                  +-----------------------------+                     +-----------------------------+
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` and configure secrets:

```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://carbonroute.org
JWT_SECRET=generate_a_cryptographically_secure_256bit_key_here
JWT_EXPIRES_IN=7d

# Storage Options: 'local' or 's3'
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=carbonroute-presentations-prod

# Initial Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@carbonroute.org
ADMIN_PASSWORD=SetAStrongPasswordHere!
```

---

## 4. Docker Production Deployment

Run with Docker Compose:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```
This starts:
- `carbonroute-backend`: Express API server on port 5000
- `carbonroute-frontend`: High-performance Nginx web server serving the compiled React bundle on port 80/443.
