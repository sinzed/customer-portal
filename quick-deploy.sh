#!/bin/bash

# Quick deployment script - for manual deployment on server
# Assumes images are already built and pushed to registry

set -e

STACK_NAME="customer-portal"
REMOTE_DIR="/opt/customer-portal"
GITHUB_REPO="${GITHUB_REPOSITORY:-your-org/customer-portal}"
REGISTRY="ghcr.io"

echo "🚀 Quick deployment script"
echo "Make sure you're on the server: root@server.powerme.space"
echo ""

# Check if Docker Swarm is initialized
if ! docker info | grep -q "Swarm: active"; then
    echo "📋 Initializing Docker Swarm..."
    docker swarm init
fi

# Navigate to project directory
cd $REMOTE_DIR || { echo "❌ Directory $REMOTE_DIR not found. Please copy files first."; exit 1; }

# Update GitHub repository in docker-compose if needed
if [ -n "$GITHUB_REPOSITORY" ]; then
    echo "🔧 Updating docker-compose.prod.yml with repository: $GITHUB_REPOSITORY"
    sed -i "s|your-org/customer-portal|$GITHUB_REPOSITORY|g" docker-compose.prod.yml
    echo "GITHUB_REPOSITORY=$GITHUB_REPOSITORY" > .env.production
fi

# Pull latest images
echo "📥 Pulling latest images from registry..."
docker pull $REGISTRY/$GITHUB_REPO/backend:latest || echo "⚠️  Warning: Could not pull backend image"
docker pull $REGISTRY/$GITHUB_REPO/frontend:latest || echo "⚠️  Warning: Could not pull frontend image"

# Deploy stack
echo "🚢 Deploying Docker Swarm stack..."
docker stack deploy -c docker-compose.prod.yml $STACK_NAME

# Wait a bit
echo "⏳ Waiting for services to start..."
sleep 15

# Show status
echo "📊 Service status:"
docker service ls | grep $STACK_NAME || echo "No services found"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: https://panel.powerme.space"
echo "🌐 Backend API: https://api.powerme.space"
echo "🌐 API Docs: https://api.powerme.space/docs"
echo ""
echo "📋 Check logs with: docker service logs customer-portal_backend"
