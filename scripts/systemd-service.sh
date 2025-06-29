#!/bin/bash

# Create systemd service for HomeVault
sudo tee /etc/systemd/system/homevault.service > /dev/null <<EOF
[Unit]
Description=HomeVault Photo Management Application
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/homevault
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=MONGO_URI=mongodb://homevault:YOUR_SECURE_PASSWORD@localhost:27017/homevault
Environment=CLIENT_ORIGIN=https://yourdomain.com
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=homevault

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/homevault/uploads

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable homevault
sudo systemctl start homevault

echo "HomeVault systemd service created and started!"
echo "Check status with: sudo systemctl status homevault"
echo "View logs with: sudo journalctl -u homevault -f" 