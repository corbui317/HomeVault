#!/bin/bash

# HomeVault Deployment Script
set -e

# Configuration
APP_NAME="homevault"
DEPLOY_PATH="/opt/homevault"
BACKUP_PATH="/opt/backups/homevault"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check if required environment variables are set
if [[ -z "$NODE_ENV" ]]; then
    export NODE_ENV=production
fi

if [[ -z "$MONGO_URI" ]]; then
    error "MONGO_URI environment variable is required"
fi

log "Starting deployment of $APP_NAME..."

# Create backup
log "Creating backup..."
if [[ -d "$DEPLOY_PATH" ]]; then
    mkdir -p "$BACKUP_PATH"
    tar -czf "$BACKUP_PATH/backup_$TIMESTAMP.tar.gz" -C "$DEPLOY_PATH" .
    log "Backup created: backup_$TIMESTAMP.tar.gz"
fi

# Stop existing application
log "Stopping existing application..."
if systemctl is-active --quiet $APP_NAME; then
    sudo systemctl stop $APP_NAME
    log "Application stopped"
fi

# Create deployment directory
log "Creating deployment directory..."
sudo mkdir -p "$DEPLOY_PATH"
sudo chown $USER:$USER "$DEPLOY_PATH"

# Copy application files
log "Copying application files..."
cp -r . "$DEPLOY_PATH/"
cd "$DEPLOY_PATH"

# Install dependencies
log "Installing dependencies..."
npm ci --only=production
cd backend && npm ci --only=production
cd ../frontend && npm ci --only=production
cd ..

# Build frontend
log "Building frontend..."
cd frontend
npm run build
cd ..

# Create uploads directory
log "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# Create systemd service file
log "Creating systemd service..."
sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=HomeVault Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_PATH
Environment=NODE_ENV=$NODE_ENV
Environment=MONGO_URI=$MONGO_URI
Environment=PORT=5000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
log "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $APP_NAME
sudo systemctl start $APP_NAME

# Wait for application to start
log "Waiting for application to start..."
sleep 5

# Check if application is running
if systemctl is-active --quiet $APP_NAME; then
    log "Application is running successfully!"
    
    # Health check
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log "Health check passed!"
    else
        warning "Health check failed, but application is running"
    fi
else
    error "Failed to start application"
fi

# Cleanup old backups (keep last 5)
log "Cleaning up old backups..."
cd "$BACKUP_PATH"
ls -t | tail -n +6 | xargs -r rm --

log "Deployment completed successfully!"
log "Application URL: http://localhost:5000"
log "Service status: sudo systemctl status $APP_NAME" 