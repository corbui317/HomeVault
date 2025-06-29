# 🚀 HomeVault Linode Deployment Guide

This guide will walk you through deploying your HomeVault application to Linode with HTTPS using Let's Encrypt.

## 📋 Prerequisites

- Linode account with a server instance
- Domain name pointing to your Linode IP
- SSH access to your Linode server
- GitHub repository with your HomeVault code

## 🔧 Step 1: Linode Server Setup

### 1.1 Create Linode Instance
1. Log into your Linode account
2. Click "Create Linode"
3. Choose configuration:
   - **Distribution**: Ubuntu 22.04 LTS
   - **Region**: Choose closest to your users
   - **Linode Plan**: At least 2GB RAM (Nanode 2GB or higher)
   - **Label**: `homevault-production`
4. Click "Create Linode"

### 1.2 Initial Server Configuration
```bash
# Connect to your Linode as root
ssh root@YOUR_LINODE_IP

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban

# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

## 🌐 Step 2: Domain and DNS Setup

### 2.1 Configure Domain
1. **Purchase/Configure Domain**: Point your domain to Linode's nameservers
2. **Add DNS Records** in your domain provider:
   ```
   Type: A
   Name: @
   Value: YOUR_LINODE_IP
   
   Type: A
   Name: www
   Value: YOUR_LINODE_IP
   ```

### 2.2 Update GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `DEPLOY_HOST`: `YOUR_LINODE_IP`
- `DEPLOY_USER`: `deploy`
- `DEPLOY_SSH_KEY`: Your private SSH key content
- `DOMAIN_NAME`: `yourdomain.com` (replace with your actual domain)

## 🛠️ Step 3: Server Environment Setup

### 3.1 Install Node.js and MongoDB
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create MongoDB user
mongosh
use admin
db.createUser({
  user: "homevault",
  pwd: "YOUR_SECURE_PASSWORD",
  roles: [{ role: "readWrite", db: "homevault" }]
})
exit
```

### 3.2 Setup SSH Keys
```bash
# Generate SSH key pair (on your local machine)
ssh-keygen -t rsa -b 4096 -C "deploy@homevault"

# Copy public key to server
ssh-copy-id deploy@YOUR_LINODE_IP

# Test SSH connection
ssh deploy@YOUR_LINODE_IP
```

## 🌐 Step 4: Nginx Configuration

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/homevault
```

Add this configuration (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Upload size limit
    client_max_body_size 100M;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Serve uploaded files directly
    location /uploads/ {
        alias /opt/homevault/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### 4.2 Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/homevault /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Step 5: Security Setup

### 5.1 Configure Firewall
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 5.2 Configure Fail2ban
```bash
# Configure fail2ban for SSH protection
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

## 🚀 Step 6: Application Setup

### 6.1 Create Application Directory
```bash
# Create application directory
sudo mkdir -p /opt/homevault
sudo chown deploy:deploy /opt/homevault
```

### 6.2 Setup Systemd Service
```bash
# Run the systemd service setup script
chmod +x scripts/systemd-service.sh
./scripts/systemd-service.sh
```

**Important**: Update the service file with your actual:
- MongoDB password
- Domain name
- Email address

## 🔐 Step 7: SSL Certificate Setup

### 7.1 Initial Certificate (Manual)
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Start nginx
sudo systemctl start nginx

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7.2 Setup Auto-renewal
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Step 8: Deploy Application

### 8.1 First Deployment
1. Push your code to the `main` branch
2. The GitHub Actions workflow will automatically:
   - Build the application
   - Deploy to your Linode server
   - Setup SSL certificate
   - Verify HTTPS

### 8.2 Manual Deployment (if needed)
```bash
# Clone your repository
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/homevault.git
sudo chown -R deploy:deploy homevault
cd homevault

# Install dependencies
npm ci --only=production
cd backend && npm ci --only=production && cd ..
cd frontend && npm ci --only=production && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Start application
sudo systemctl start homevault
sudo systemctl enable homevault
```

## ✅ Step 9: Verification

### 9.1 Check Application Status
```bash
# Check application status
sudo systemctl status homevault

# Check nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# View application logs
sudo journalctl -u homevault -f
```

### 9.2 Test HTTPS
```bash
# Test HTTPS locally
curl -f https://yourdomain.com/health

# Test from external
curl -f https://yourdomain.com/health
```

## 🔧 Step 10: Monitoring and Maintenance

### 10.1 Setup Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/homevault > /dev/null <<EOF
/var/log/homevault/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        systemctl reload homevault
    endscript
}
EOF
```

### 10.2 Setup Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system resources
htop
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**:
   ```bash
   sudo journalctl -u homevault -f
   ```

2. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

3. **Nginx configuration errors**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **MongoDB connection issues**:
   ```bash
   sudo systemctl status mongod
   mongosh --host localhost --port 27017
   ```

### Useful Commands
```bash
# Restart all services
sudo systemctl restart homevault nginx mongod

# Check disk space
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn | grep :5000
```

## 📞 Support

If you encounter issues:
1. Check the logs: `sudo journalctl -u homevault -f`
2. Verify all services are running: `sudo systemctl status homevault nginx mongod`
3. Test connectivity: `curl -f https://yourdomain.com/health`

Your HomeVault application should now be running securely on Linode with HTTPS! 🎉 