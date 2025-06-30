#!/bin/bash

# HomeVault Systemd Service Setup Script
# Replace YOUR_ACTUAL_MONGODB_PASSWORD with your real MongoDB password

MONGODB_PASSWORD="YOUR_ACTUAL_MONGODB_PASSWORD"
DOMAIN_NAME="home-vault.me"

# Create systemd service file
sudo tee /etc/systemd/system/homevault.service > /dev/null <<EOF
[Unit]
Description=HomeVault Application
After=network.target mongod.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/homevault
Environment=NODE_ENV=production
Environment=MONGO_URI=mongodb://homevault:${MONGODB_PASSWORD}@localhost:27017/homevault
Environment=CLIENT_ORIGIN=https://${DOMAIN_NAME}
Environment=PORT=5000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable homevault

echo "Systemd service created and enabled!"
echo "To start the service: sudo systemctl start homevault"
echo "To check status: sudo systemctl status homevault"
echo "To view logs: sudo journalctl -u homevault -f" 