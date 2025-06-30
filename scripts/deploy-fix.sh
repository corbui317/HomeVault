#!/bin/bash

# Clean deployment script for HomeVault
# This script properly handles permissions and avoids duplicate npm installs

set -e  # Exit on any error

echo "Starting clean deployment..."

cd /opt/homevault

# Set environment variables
export NODE_ENV=production
export MONGO_URI=mongodb://homevault:$MONGODB_PASSWORD@localhost:27017/homevault
export CLIENT_ORIGIN=https://$DOMAIN_NAME
export PORT=5000

# Ensure proper permissions and clean up any existing node_modules
echo "Ensuring proper permissions and cleaning up..."
sudo chown -R deploy:deploy /opt/homevault
sudo rm -rf node_modules backend/node_modules

# Create uploads directory if it doesn't exist
mkdir -p uploads
chmod 755 uploads

# Set up environment file
echo "MONGODB_URI=mongodb://homevault:$MONGODB_PASSWORD@localhost:27017/homevault" > backend/.env
echo "FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/opt/homevault/backend/firebase-service-account.json" >> backend/.env
echo "CLIENT_ORIGIN=https://$DOMAIN_NAME" >> backend/.env
echo "PORT=5000" >> backend/.env

# Install root dependencies
echo "Installing root dependencies..."
npm install --omit=dev --no-audit --no-fund

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install --omit=dev --no-audit --no-fund && cd ..

# Verify installations
echo "Verifying installations..."
echo "Root Express version:"
npm list express
echo "Backend Express version:"
cd backend && npm list express && cd ..

echo "Restarting application..."
sudo systemctl restart homevault

# Check if application is running
echo "Waiting for application to start..."
sleep 15

# Try multiple health checks
for i in {1..5}; do
  echo "Health check attempt $i..."
  if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    break
  else
    echo "❌ Health check failed, attempt $i"
    if [ $i -eq 5 ]; then
      echo "Application failed to start after 5 attempts"
      echo "=== Service Status ==="
      sudo systemctl status homevault --no-pager
      echo "=== Recent Logs ==="
      sudo journalctl -u homevault -n 30 --no-pager
      echo "=== Application Directory ==="
      ls -la /opt/homevault/
      echo "=== Backend Directory ==="
      ls -la /opt/homevault/backend/
      echo "=== MongoDB Status ==="
      sudo systemctl status mongod --no-pager
      exit 1
    fi
    sleep 5
  fi
done

echo "Deployment completed successfully!" 