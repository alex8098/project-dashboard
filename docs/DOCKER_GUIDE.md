# 🐳 Docker Guide for Agent Mission Control

Complete guide for running the Agent Mission Control dashboard in Docker environments.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Docker Configuration](#docker-configuration)
3. [Networking](#networking)
4. [Volume Mounts](#volume-mounts)
5. [Environment Variables](#environment-variables)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Using Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - OPENCLAW_GATEWAY_URL=${OPENCLAW_GATEWAY_URL}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
    volumes:
      - ./database:/app/database
      - ./.env.local:/app/.env.local:ro
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

### Option 2: Using Dockerfile

Create `Dockerfile`:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Create database directory
RUN mkdir -p /app/database

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t agent-dashboard .
docker run -p 3000:3000 -v $(pwd)/database:/app/database agent-dashboard
```

---

## Docker Configuration

### Environment Variables

Create `.env.docker`:

```env
# Required
GITHUB_TOKEN=ghp_your_github_token

# Optional - OpenClaw Integration
OPENCLAW_GATEWAY_URL=http://host.docker.internal:18789
OPENCLAW_GATEWAY_TOKEN=your_token

# Optional - Database
DATABASE_PATH=/app/database/dashboard.db

# Optional - Security
SESSION_SECRET=your_random_secret

# Optional - Features
ENABLE_GITHUB_SYNC=true
ENABLE_AGENT_SPAWN=true
AUTO_REFRESH_INTERVAL=5000
```

### Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./database` | `/app/database` | SQLite database persistence |
| `./.env.local` | `/app/.env.local` | Environment configuration |
| `./logs` | `/app/logs` | Application logs |

---

## Networking

### Port Mapping

```yaml
ports:
  - "3000:3000"      # Main dashboard
  - "3001:3001"      # Optional: API metrics
```

### Network Modes

**Bridge (default):**
```yaml
network_mode: bridge
```

**Host (for local dev):**
```yaml
network_mode: host
```

**Custom network:**
```yaml
networks:
  dashboard-net:
    driver: bridge

services:
  dashboard:
    networks:
      - dashboard-net
```

### Accessing Host Services

From inside container, access host services:

```bash
# macOS/Windows
host.docker.internal:3000

# Linux (use host IP)
172.17.0.1:3000
```

---

## Production Deployment

### Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'

services:
  dashboard:
    image: agent-dashboard:latest
    ports:
      - "3000:3000"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    volumes:
      - dashboard-data:/app/database
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

volumes:
  dashboard-data:
```

Deploy:
```bash
docker stack deploy -c docker-stack.yml agent-dashboard
```

### Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: agent-dashboard
  template:
    metadata:
      labels:
        app: agent-dashboard
    spec:
      containers:
      - name: dashboard
        image: agent-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: github-token
              key: token
        volumeMounts:
        - name: database
          mountPath: /app/database
      volumes:
      - name: database
        persistentVolumeClaim:
          claimName: dashboard-db
---
apiVersion: v1
kind: Service
metadata:
  name: agent-dashboard
spec:
  selector:
    app: agent-dashboard
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

Apply:
```bash
kubectl apply -f k8s-deployment.yaml
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs agent-dashboard

# Check if port is in use
lsof -i :3000

# Run with debug mode
docker run -e DEBUG=true agent-dashboard
```

### Database Issues

```bash
# Database is locked
rm database/dashboard.db
npm run dev

# Permission denied
chmod 777 database/

# Check database from container
docker exec -it agent-dashboard sh
sqlite3 /app/database/dashboard.db ".tables"
```

### GitHub Sync Fails

```bash
# Check token is set
docker exec agent-dashboard env | grep GITHUB

# Test GitHub API
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user

# Check rate limits
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/rate_limit
```

### Network Issues

```bash
# Can't reach host from container
docker exec agent-dashboard ping host.docker.internal

# Check DNS
docker exec agent-dashboard nslookup github.com

# Test API from container
docker exec agent-dashboard curl http://host.docker.internal:3000/api/agents
```

### Performance Issues

```bash
# High memory usage
docker stats agent-dashboard

# Slow queries
# Check SQLite performance
sqlite3 database/dashboard.db "PRAGMA optimize;"

# Clear old logs
rm -rf logs/*
```

---

## Security Best Practices

### 1. Secrets Management

**❌ Don't:**
```dockerfile
ENV GITHUB_TOKEN=ghp_xxx
```

**✅ Do:**
```yaml
# docker-compose.yml
environment:
  - GITHUB_TOKEN=${GITHUB_TOKEN}
```

### 2. Network Isolation

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

### 3. Read-Only Filesystem

```yaml
services:
  dashboard:
    read_only: true
    tmpfs:
      - /tmp
      - /app/database
```

### 4. Non-Root User

```dockerfile
RUN adduser -D -u 1000 appuser
USER appuser
```

---

## Useful Commands

### Daily Operations

```bash
# Start dashboard
docker-compose up -d

# View logs
docker-compose logs -f

# Stop dashboard
docker-compose down

# Restart
docker-compose restart

# Update to latest
git pull
docker-compose up -d --build
```

### Backup & Restore

```bash
# Backup database
docker exec agent-dashboard sqlite3 /app/database/dashboard.db ".backup /app/database/backup.db"
docker cp agent-dashboard:/app/database/backup.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup.db agent-dashboard:/app/database/dashboard.db
```

### Monitoring

```bash
# Resource usage
docker stats agent-dashboard

# Health check
curl http://localhost:3000/api/agents

# Database size
docker exec agent-dashboard ls -lh /app/database/
```

---

## Resources

- **GitHub Repo:** https://github.com/alex8098/project-dashboard
- **OpenClaw Docs:** https://docs.openclaw.ai
- **Next.js Docs:** https://nextjs.org/docs
- **SQLite Docs:** https://www.sqlite.org/docs.html

---

**Need help?** Check the troubleshooting section or open an issue on GitHub!

**Built with ❤️ for AI agent coordination** 🚀