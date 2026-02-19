#!/bin/bash

# Backend deployment script
# Builds the FastAPI backend and deploys to /var/www/html/api
# Supports both local and remote deployment via SSH/SCP

set -e  # Exit on error

echo "Starting backend deployment..."

# Configuration - can be overridden by environment variables
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/html/api}"
LOCAL_DEPLOY_DIR="${LOCAL_DEPLOY_DIR:-/var/www/html/api}"

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

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 first."
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

# Copy application files to temp directory
cp -r "$SCRIPT_DIR/app" "$TEMP_DIR/"
cp -r "$SCRIPT_DIR/mocks" "$TEMP_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$TEMP_DIR/"

# Copy systemd service file if it exists
if [ -f "$SCRIPT_DIR/customer-portal-api.service" ]; then
    echo "Including systemd service file..."
    cp "$SCRIPT_DIR/customer-portal-api.service" "$TEMP_DIR/"
fi

# Copy install-service script if it exists
if [ -f "$SCRIPT_DIR/install-service.sh" ]; then
    echo "Including service installation script..."
    cp "$SCRIPT_DIR/install-service.sh" "$TEMP_DIR/"
    chmod +x "$TEMP_DIR/install-service.sh"
fi

# Create startup script
cat > "$TEMP_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# Bind to 127.0.0.1 for security when behind Apache reverse proxy
uvicorn app.main:app --host 127.0.0.1 --port 8000
EOF
chmod +x "$TEMP_DIR/start.sh"

# Copy files to remote server
echo "Uploading files to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR..."
scp -r "$TEMP_DIR"/* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Clean up temp directory
rm -rf "$TEMP_DIR"

# Set up virtual environment and install dependencies on remote server
echo "Setting up Python virtual environment on remote server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && \
    if [ ! -d venv ]; then \
        python3 -m venv venv; \
    fi && \
    source venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt"

# Set proper permissions on remote server
echo "Setting permissions on remote server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "chown -R www-data:www-data $REMOTE_DIR && chmod +x $REMOTE_DIR/start.sh"

echo "Backend deployment completed successfully!"
echo "Deployment location: $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
echo ""
echo "To start the server manually, run:"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && ./start.sh'"
echo ""
echo "To install as a permanent systemd service, run:"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'sudo $REMOTE_DIR/install-service.sh'"
echo ""
echo "Or manually install the service:"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'sudo cp $REMOTE_DIR/customer-portal-api.service /etc/systemd/system/'"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'sudo systemctl daemon-reload'"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'sudo systemctl enable customer-portal-api'"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'sudo systemctl start customer-portal-api'"
