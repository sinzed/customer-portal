# Docker Setup

This project is containerized using Docker and Docker Compose for easy deployment.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Build and Start Services

```bash
docker compose up --build
```

This will:
1. Build both backend and frontend images
2. Start both services
3. Make them available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Start Services (if already built)

```bash
docker compose up
```

### Start in Background

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend

# Follow logs
docker compose logs -f
```

### Rebuild After Changes

```bash
# Rebuild and restart
docker compose up --build

# Rebuild specific service
docker compose build backend
docker compose build frontend
```

## Services

### Backend (FastAPI)
- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Container**: `customer-portal-backend`

### Frontend (React)
- **Port**: 3000
- **URL**: http://localhost:3000
- **Container**: `customer-portal-frontend`
- **Web Server**: Nginx

## Development vs Production

### Development
For development, you can still use the local setup:
```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

### Production
Use Docker Compose for production-like environment:
```bash
docker compose up -d
```

## Environment Variables

### Backend
Currently uses defaults. To customize, add to `docker-compose.yml`:
```yaml
backend:
  environment:
    - PYTHONUNBUFFERED=1
    - LOG_LEVEL=info
```

### Frontend
The API URL is set at build time via `VITE_API_URL`:
```yaml
frontend:
  build:
    args:
      - VITE_API_URL=http://localhost:8000
```

**Note**: Since API calls are made from the browser (not the container), use `localhost:8000` so the browser can reach the backend.

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change frontend port
  - "8001:8000"  # Change backend port
```

### Rebuild After Code Changes
```bash
docker compose down
docker compose up --build
```

### Check Container Status
```bash
docker compose ps
```

### Access Container Shell
```bash
# Backend
docker compose exec backend /bin/bash

# Frontend
docker compose exec frontend /bin/sh
```

### View Container Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Network

Services communicate via the `customer-portal-network` Docker network. The frontend container can reach the backend at `http://backend:8000`, but since API calls are made from the browser, use `http://localhost:8000`.

## Volumes

The backend mocks directory is mounted as a read-only volume for development:
```yaml
volumes:
  - ./backend/mocks:/app/mocks:ro
```

This allows you to update mock data without rebuilding the container.
