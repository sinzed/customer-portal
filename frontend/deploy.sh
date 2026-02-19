#!/bin/bash

# Frontend deployment script
# Builds the React/Vite frontend and deploys to /var/www/html/panel
# Supports both local and remote deployment via SSH/SCP

set -e  # Exit on error

echo "Starting frontend deployment..."

# Configuration - can be overridden by environment variables
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/html/panel}"
LOCAL_DEPLOY_DIR="${LOCAL_DEPLOY_DIR:-/var/www/html/panel}"
# API URL for production - defaults to api.powerme.space (can be overridden via VITE_API_URL env var)
VITE_API_URL="${VITE_API_URL:-https://api.powerme.space}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Try to source setup-env.sh if REMOTE_HOST is not set
if [ -z "$REMOTE_HOST" ] && [ -f "$PROJECT_ROOT/setup-env.sh" ]; then
    echo "Loading environment from setup-env.sh..."
    source "$PROJECT_ROOT/setup-env.sh"
fi

# Require REMOTE_HOST to be set
if [ -z "$REMOTE_HOST" ]; then
    echo "Error: REMOTE_HOST is not set."
    echo "Please either:"
    echo "  1. Source setup-env.sh: source setup-env.sh"
    echo "  2. Set REMOTE_HOST environment variable: REMOTE_HOST=server.powerme.space ./deploy.sh"
    exit 1
fi

# Remote deployment is required
IS_REMOTE=true
echo "Remote deployment mode enabled"
echo "Remote host: $REMOTE_USER@$REMOTE_HOST"
echo "Remote directory: $REMOTE_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check if SSH/SCP are available
if ! command -v ssh &> /dev/null; then
    echo "Error: ssh is not installed. Please install openssh-client."
    exit 1
fi
if ! command -v scp &> /dev/null; then
    echo "Error: scp is not installed. Please install openssh-client."
    exit 1
fi

# Test SSH connection
echo "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" exit 2>/dev/null; then
    echo "Error: Cannot connect to $REMOTE_USER@$REMOTE_HOST"
    echo "Please ensure:"
    echo "  1. SSH key is set up (use ssh-copy-id if needed)"
    echo "  2. SSH connection works: ssh $REMOTE_USER@$REMOTE_HOST"
    exit 1
fi
echo "SSH connection successful"

# Install dependencies
echo "Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm install

# Ensure .env.production exists with the correct API URL
echo "Configuring production environment..."
ENV_PROD_FILE="$SCRIPT_DIR/.env.production"
if [ ! -f "$ENV_PROD_FILE" ] || ! grep -q "VITE_API_URL" "$ENV_PROD_FILE" 2>/dev/null; then
    echo "Creating/updating .env.production file..."
    echo "# Production environment variables" > "$ENV_PROD_FILE"
    echo "# This file is automatically loaded by Vite when running 'npm run build'" >> "$ENV_PROD_FILE"
    echo "VITE_API_URL=$VITE_API_URL" >> "$ENV_PROD_FILE"
fi
echo "Using API URL: $VITE_API_URL"

# Build the project (Vite automatically uses production mode and loads .env.production)
echo "Building frontend project for production..."
npm run build

# Check if build was successful
if [ ! -d "$SCRIPT_DIR/dist" ]; then
    echo "Error: Build directory 'dist' not found. Build may have failed."
    exit 1
fi

# Deploy to remote server
echo "Deploying to remote server..."

# Create remote directory if it doesn't exist
echo "Creating remote directory: $REMOTE_DIR"
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"

# Create temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "Preparing files in temporary directory: $TEMP_DIR"

# Copy built files to temp directory
cp -r "$SCRIPT_DIR/dist"/* "$TEMP_DIR/"

# Copy .htaccess file (required for Apache client-side routing)
if [ -f "$SCRIPT_DIR/.htaccess" ]; then
    echo "Including .htaccess file for Apache routing..."
    cp "$SCRIPT_DIR/.htaccess" "$TEMP_DIR/.htaccess"
else
    echo "Warning: .htaccess file not found in $SCRIPT_DIR"
    echo "Apache client-side routing may not work correctly without it."
fi

# Upload all files to remote server
echo "Uploading files to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR..."
echo "  - Built frontend files from dist/"

# Copy all non-hidden files first
scp -r "$TEMP_DIR"/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Explicitly copy .htaccess file (required for Apache routing)
# This is done separately because wildcards (*) don't match hidden files
if [ -f "$TEMP_DIR/.htaccess" ]; then
    echo "  - Uploading .htaccess file..."
    scp "$TEMP_DIR/.htaccess" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/.htaccess"
    echo "  - .htaccess file uploaded successfully"
elif [ -f "$SCRIPT_DIR/.htaccess" ]; then
    echo "  - Uploading .htaccess file directly from source..."
    scp "$SCRIPT_DIR/.htaccess" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/.htaccess"
    echo "  - .htaccess file uploaded successfully"
else
    echo "  - Warning: .htaccess file not found, skipping..."
fi

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Set proper permissions on remote server
echo "Setting permissions on remote server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "chown -R www-data:www-data $REMOTE_DIR && chmod -R 755 $REMOTE_DIR"

echo "Frontend deployment completed successfully!"
echo "Deployment location: $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
echo "Files are ready to be served by a web server (nginx/apache)"
