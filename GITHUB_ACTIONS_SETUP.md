# GitHub Actions CI/CD Setup Guide

This guide explains how to set up GitHub Actions for the HomeVault project.

## 🔧 **Prerequisites**

1. **GitHub Repository**: Your HomeVault project should be in a GitHub repository
2. **GitHub Account**: You need admin access to the repository
3. **Deployment Servers**: Staging and production servers (optional)

## 🚀 **Step 1: Repository Setup**

### Branch Strategy
- `main` - Production branch
- `develop` - Development/Staging branch
- `feature/*` - Feature branches

### Protected Branches
1. Go to your repository → Settings → Branches
2. Add branch protection rules for `main` and `develop`
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date

## 🔐 **Step 2: GitHub Secrets Setup**

Go to your repository → Settings → Secrets and variables → Actions

### Required Secrets

#### **SNYK_TOKEN** (Optional)
- Get from [Snyk](https://snyk.io/)
- Used for security scanning
- If not provided, security scan will be skipped

#### **DEPLOY_SSH_KEY** (For server deployment)
- Private SSH key for deployment server access
- Generate: `ssh-keygen -t rsa -b 4096 -C "deploy@homevault"`
- Add public key to deployment server's `~/.ssh/authorized_keys`

#### **DEPLOY_HOST** (For server deployment)
- IP address or hostname of deployment server
- Example: `192.168.1.100` or `deploy.example.com`

#### **DEPLOY_USER** (For server deployment)
- Username for deployment server
- Example: `deploy` or `ubuntu`

#### **MONGO_URI_STAGING** (For staging environment)
- MongoDB connection string for staging
- Example: `mongodb://localhost:27017/homevault_staging`

#### **MONGO_URI_PRODUCTION** (For production environment)
- MongoDB connection string for production
- Example: `mongodb://localhost:27017/homevault_production`

#### **FIREBASE_SERVICE_ACCOUNT_KEY** (For Firebase integration)
- JSON content of Firebase service account key
- Get from Firebase Console → Project Settings → Service Accounts

## 🌍 **Step 3: Environment Setup**

### Staging Environment
1. Go to Settings → Environments
2. Create environment named `staging`
3. Add environment variables:
   - `NODE_ENV=staging`
   - `MONGO_URI=${{ secrets.MONGO_URI_STAGING }}`
   - `CLIENT_ORIGIN=https://staging.homevault.com`

### Production Environment
1. Create environment named `production`
2. Add environment variables:
   - `NODE_ENV=production`
   - `MONGO_URI=${{ secrets.MONGO_URI_PRODUCTION }}`
   - `CLIENT_ORIGIN=https://homevault.com`
3. Enable "Required reviewers" for production deployments

## 🔄 **Step 4: Workflow Customization**

### Update Deployment Commands

Edit `.github/workflows/ci-cd.yml` and replace the deployment steps:

#### For Server Deployment:
```yaml
- name: Deploy to server
  run: |
    # Copy files to server
    rsync -avz --delete \
      --exclude 'node_modules' \
      --exclude '.git' \
      ./ ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:/opt/homevault/
    
    # Run deployment script
    ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
      "cd /opt/homevault && MONGO_URI=${{ secrets.MONGO_URI_PRODUCTION }} ./scripts/deploy.sh"
```

#### For Docker Deployment:
```yaml
- name: Deploy with Docker
  run: |
    # Build and push Docker image
    docker build -t homevault:${{ github.sha }} .
    docker tag homevault:${{ github.sha }} your-registry/homevault:latest
    docker push your-registry/homevault:latest
    
    # Deploy to server
    ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
      "docker pull your-registry/homevault:latest && docker-compose up -d"
```

#### For Cloud Deployment (AWS, GCP, Azure):
```yaml
- name: Deploy to cloud
  run: |
    # Add your cloud deployment commands here
    # Example for AWS ECS, Google Cloud Run, or Azure App Service
```

## 🧪 **Step 5: Testing Setup**

### Add Test Scripts

Make sure your `package.json` files have test scripts:

#### Backend (`backend/package.json`):
```json
{
  "scripts": {
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### Frontend (`frontend/package.json`):
```json
{
  "scripts": {
    "test": "react-scripts test --watchAll=false --coverage",
    "test:watch": "react-scripts test"
  }
}
```

### Add Lint Scripts

#### Backend:
```json
{
  "scripts": {
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix"
  }
}
```

#### Frontend:
```json
{
  "scripts": {
    "lint": "eslint src --ext .js,.jsx",
    "lint:fix": "eslint src --ext .js,.jsx --fix"
  }
}
```

## 📊 **Step 6: Monitoring Setup**

### Add Status Badge

Add this to your README.md:
```markdown
![CI/CD Pipeline](https://github.com/yourusername/homevault/workflows/HomeVault%20CI%2FCD%20Pipeline/badge.svg)
```

### Set up Notifications

#### Slack Integration:
1. Create Slack app and get webhook URL
2. Add `SLACK_WEBHOOK_URL` secret
3. Update notification step in workflow:

```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"❌ HomeVault CI/CD pipeline failed!"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Email Notifications:
```yaml
- name: Send email notification
  if: failure()
  run: |
    # Add email notification logic
    echo "Pipeline failed" | mail -s "CI/CD Failure" admin@example.com
```

## 🔍 **Step 7: Troubleshooting**

### Common Issues

#### **Workflow not triggering**
- Check branch names in workflow file
- Ensure files are in correct paths
- Verify GitHub Actions is enabled

#### **Tests failing**
- Check test environment setup
- Verify MongoDB connection in tests
- Check for missing dependencies

#### **Build failing**
- Verify Node.js version compatibility
- Check for missing environment variables
- Review build logs for specific errors

#### **Deployment failing**
- Verify SSH keys and server access
- Check server permissions
- Review deployment logs

### Debug Commands

Add these to your workflow for debugging:
```yaml
- name: Debug information
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    echo "Files in directory: $(ls -la)"
```

## 📈 **Step 8: Performance Optimization**

### Caching
The workflow already includes npm caching. For additional optimization:

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
      */*/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Parallel Jobs
Consider running independent jobs in parallel:
```yaml
jobs:
  lint:
    # Linting job
  test:
    # Testing job
  build:
    needs: [lint, test]  # Only run after lint and test pass
```

## 🎯 **Next Steps**

1. **Push your code** to trigger the first workflow run
2. **Monitor the Actions tab** to see pipeline progress
3. **Review and fix** any issues that arise
4. **Set up monitoring** for your deployed applications
5. **Configure alerts** for pipeline failures

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Examples](https://github.com/actions/starter-workflows)
- [Docker Documentation](https://docs.docker.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/) 