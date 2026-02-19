#!/bin/bash

# Docker Swarm Deployment Script
# Deploys customer portal to production server
# Assumes images are already built and pushed to registry

set -e

SERVER="${PROD_SERVER_HOST:-root@server.powerme.space}"
REMOTE_DIR="/opt/customer-portal"
STACK_NAME="customer-portal"
GITHUB_REPO="${GITHUB_REPOSITORY:-your-org/customer-portal}"
REGISTRY="ghcr.io"

echo "🚀 Starting deployment to production server..."

# Check if Docker Swarm is initialized
echo "📋 Checking Docker Swarm status..."
ssh $SERVER "docker info | grep -q 'Swarm: active' || docker swarm init"

# Create remote directory
echo "📁 Creating remote directory..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copy files to server (excluding build artifacts)
echo "📦 Copying files to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'venv' \
  --exclude '__pycache__' --exclude '*.pyc' --exclude 'dist' \
  --exclude '.github' \
  ./ $SERVER:$REMOTE_DIR/

# Set GitHub repository in docker-compose file
echo "🔧 Configuring docker-compose.prod.yml..."
ssh $SERVER "cd $REMOTE_DIR && \
  sed -i 's|your-org/customer-portal|$GITHUB_REPO|g' docker-compose.prod.yml && \
  echo 'GITHUB_REPOSITORY=$GITHUB_REPO' > .env.production"

# Login to GitHub Container Registry (if needed)
echo "🔐 Logging in to GitHub Container Registry..."
ssh $SERVER "echo \$GITHUB_TOKEN | docker login $REGISTRY -u \$GITHUB_USERNAME --password-stdin" || \
  echo "⚠️  Warning: Could not login to registry. Make sure GITHUB_TOKEN and GITHUB_USERNAME are set on server."

# Pull latest images
echo "📥 Pulling latest images from registry..."
ssh $SERVER "cd $REMOTE_DIR && \
  docker pull $REGISTRY/$GITHUB_REPO/backend:latest && \
  docker pull $REGISTRY/$GITHUB_REPO/frontend:latest"

# Deploy stack
echo "🚢 Deploying Docker Swarm stack..."
ssh $SERVER "cd $REMOTE_DIR && docker stack deploy -c docker-compose.prod.yml $STACK_NAME"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo "📊 Service status:"
ssh $SERVER "docker service ls | grep $STACK_NAME || echo 'No services found'"

echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: https://panel.powerme.space"
echo "🌐 Backend API: https://api.powerme.space"
echo "🌐 API Docs: https://api.powerme.space/docs"
echo "🌐 Traefik Dashboard: http://89.167.0.194:8080"
