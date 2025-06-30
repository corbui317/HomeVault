# EC2 Setup Guide for HomeVault

## Prerequisites
- EC2 instance running Ubuntu 22.04 LTS or later
- Security group configured with ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Domain name pointing to your EC2 instance
- GitHub repository with updated secrets

## Step 1: Initial Server Setup

### Connect to your EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install essential packages
```bash
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

## Step 2: Create Deploy User

### Create the deploy user
```bash
sudo adduser deploy
```

### Add deploy user to sudo group
```bash
sudo usermod -aG sudo deploy
```

### Switch to deploy user and set up SSH
```bash
sudo su - deploy
mkdir ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Add your SSH public key to deploy user
```bash
# Copy your public key content and paste it here
echo "YOUR_SSH_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
```

### Test SSH connection as deploy user
```bash
# From your local machine, test:
ssh deploy@your-ec2-public-ip
```

## Step 3: Install Node.js and MongoDB

### Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Node.js installation
```bash
node --version
npm --version
```

### Install MongoDB
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### Create MongoDB user for HomeVault
```bash
# Connect to MongoDB
mongosh

# Create database and user
use homevault
db.createUser({
  user: "homevault",
  pwd: "YOUR_SECURE_PASSWORD",
  roles: [
    { role: "readWrite", db: "homevault" }
  ]
})

# Exit MongoDB
exit
```

## Step 4: Install and Configure Nginx

### Install Nginx
```bash
sudo apt install -y nginx
```

### Start and enable Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Nginx for HomeVault
```bash
sudo nano /etc/nginx/sites-available/homevault
```

### Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (will be added after Let's Encrypt setup)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend static files
    location / {
        root /opt/homevault/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Upload directory (if needed for direct access)
    location /uploads/ {
        alias /opt/homevault/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/homevault /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 5: Install Certbot for SSL

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL certificate (replace with your domain)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Test automatic renewal
```bash
sudo certbot renew --dry-run
```

## Step 6: Create Application Directory and Set Permissions

### Create application directory
```bash
sudo mkdir -p /opt/homevault
sudo chown deploy:deploy /opt/homevault
```

### Create uploads directory
```bash
mkdir -p /opt/homevault/uploads
chmod 755 /opt/homevault/uploads
```

## Step 7: Create Systemd Service

### Create service file
```bash
sudo nano /etc/systemd/system/homevault.service
```

### Add the following content:
```ini
[Unit]
Description=HomeVault Application
After=network.target mongod.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/opt/homevault
Environment=NODE_ENV=production
Environment=MONGO_URI=mongodb://homevault:YOUR_SECURE_PASSWORD@localhost:27017/homevault
Environment=CLIENT_ORIGIN=https://your-domain.com
Environment=PORT=5000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable homevault
```

## Step 8: Configure Firewall (if using UFW)

### Enable UFW and configure rules
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 9: Set Up Passwordless Sudo for Deploy User

### Configure sudoers for deploy user
```bash
sudo visudo
```

### Add this line at the end:
```
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart homevault, /bin/systemctl stop homevault, /bin/systemctl start homevault, /bin/systemctl reload nginx, /bin/systemctl restart nginx
```

## Step 10: Test the Setup

### Test Nginx configuration
```bash
sudo nginx -t
```

### Test MongoDB connection
```bash
mongosh "mongodb://homevault:YOUR_SECURE_PASSWORD@localhost:27017/homevault"
```

### Check service status
```bash
sudo systemctl status homevault
sudo systemctl status nginx
sudo systemctl status mongod
```

## Step 11: Update GitHub Secrets

Make sure your GitHub repository has these secrets configured:

- `DEPLOY_HOST`: Your EC2 public IP or domain
- `DEPLOY_USER`: `deploy`
- `DEPLOY_SSH_KEY`: Your private SSH key content
- `DOMAIN_NAME`: Your domain name (e.g., `your-domain.com`)

## Step 12: Deploy Your Application

### Trigger deployment from GitHub
1. Push to your main branch
2. Monitor the GitHub Actions workflow
3. Check deployment logs

### Verify deployment
```bash
# Check if application is running
curl http://localhost:5000/health

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application logs
sudo journalctl -u homevault -f
```

## Troubleshooting

### Common Issues:

1. **Permission denied errors**: Make sure the deploy user owns `/opt/homevault`
2. **MongoDB connection issues**: Verify MongoDB is running and credentials are correct
3. **Nginx 502 errors**: Check if the Node.js application is running on port 5000
4. **SSL certificate issues**: Ensure your domain is pointing to the EC2 instance

### Useful Commands:

```bash
# Check service status
sudo systemctl status homevault nginx mongod

# View logs
sudo journalctl -u homevault -n 50 --no-pager
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart homevault nginx mongod

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Notes

1. **Keep your system updated**: `sudo apt update && sudo apt upgrade`
2. **Monitor logs regularly**: Check for suspicious activity
3. **Backup your data**: Set up regular backups of your MongoDB database
4. **Use strong passwords**: Ensure all passwords are secure
5. **Limit SSH access**: Consider using key-based authentication only

Your EC2 instance is now ready for HomeVault deployment! 