# Quick Start - Production Deployment

## Prerequisites Checklist

- [ ] DNS records configured:
  - `panel.powerme.space` → `89.167.0.194`
  - `api.powerme.space` → `89.167.0.194`
- [ ] SSH access to `root@server.powerme.space`
- [ ] Docker and Docker Compose installed on server

## Step 1: Initial Server Setup (One-time)

SSH into server:
```bash
ssh root@server.powerme.space
```

Install Docker (if not already installed):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

Initialize Docker Swarm:
```bash
docker swarm init
```

Configure firewall:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## Step 2: Copy Files to Server

From your local machine:
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'venv' \
  --exclude '__pycache__' --exclude '*.pyc' \
  ./ root@server.powerme.space:/opt/customer-portal/
```

## Step 3: Deploy

### Option A: Automated (from local machine)
```bash
./deploy.sh
```

### Option B: Manual (on server)

SSH into server:
```bash
ssh root@server.powerme.space
cd /opt/customer-portal
chmod +x quick-deploy.sh
./quick-deploy.sh
```

Or manually:
```bash
# Build images
cd /opt/customer-portal/backend
docker build -t customer-portal-backend:latest .

cd ../frontend
docker build --build-arg VITE_API_URL=https://api.powerme.space -t customer-portal-frontend:latest .

# Deploy
cd /opt/customer-portal
docker stack deploy -c docker-compose.prod.yml customer-portal
```

## Step 4: Verify

Check services:
```bash
docker service ls
```

Check logs:
```bash
docker service logs customer-portal_backend
docker service logs customer-portal_frontend
docker service logs customer-portal_traefik
```

Test endpoints:
```bash
curl https://api.powerme.space/health
curl -I https://panel.powerme.space
```

## Access Points

- **Frontend**: https://panel.powerme.space
- **Backend API**: https://api.powerme.space
- **API Docs**: https://api.powerme.space/docs
- **Traefik Dashboard**: http://89.167.0.194:8080

## Common Commands

```bash
# View all services
docker service ls

# View service details
docker service ps customer-portal_backend

# View logs
docker service logs -f customer-portal_backend

# Scale service
docker service scale customer-portal_backend=3

# Update service
docker service update --force customer-portal_backend

# Remove stack
docker stack rm customer-portal
```

## Troubleshooting

### Services not starting
```bash
docker service logs customer-portal_backend
docker service inspect customer-portal_backend
```

### SSL certificate issues
1. Verify DNS records point to server IP
2. Check Traefik logs: `docker service logs customer-portal_traefik`
3. Wait a few minutes for Let's Encrypt to issue certificates

### Update deployment
```bash
# Rebuild and redeploy
cd /opt/customer-portal
./quick-deploy.sh
```

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
