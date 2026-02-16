# TIP Customer Frontend - Deployment Setup Guide

This guide walks you through setting up CI/CD for the TIP customer frontend.

## Overview

- **Preview**: Auto-deploys to `www.tip.zetos.io` on push to `develop` branch
- **Production**: Manual deploy to `www.travelinyourpocket.com` via GitHub Actions workflow dispatch

## Prerequisites

- [x] GitHub repository for TiP
- [x] AWS EC2 server (52.52.21.225) with SSH access
- [x] Domain DNS configured

**Note**: No Docker Hub account needed! Using GitHub Container Registry (ghcr.io)

---

## Part 1: GitHub Secrets Setup

Add the following secrets to your GitHub repository:

### Navigate to Repository Settings
1. Go to your TiP repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `EC2_HOST` | `52.52.21.225` | EC2 server IP address |
| `EC2_USER` | `ubuntu` | SSH username |
| `EC2_SSH_KEY` | Contents of `smalltinkerlab-key.pem` | Private SSH key for deployment |

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions - no setup needed!

### How to Get EC2_SSH_KEY Value

```bash
# Read the SSH key content
cat ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem

# Copy the entire output (including BEGIN and END lines)
# Paste into GitHub secret
```

---

## Part 2: EC2 Server Setup

### Step 1: Connect to Server

```bash
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225
```

### Step 2: Install Docker (if not already installed)

```bash
# Update package list
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Verify installation
docker --version

# Log out and back in for group changes to take effect
exit
```

Re-connect:
```bash
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225
```

### Step 3: Login to GitHub Container Registry

```bash
# Create GitHub Personal Access Token first:
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# 2. Generate new token with 'read:packages' scope
# 3. Copy the token

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Example:
# echo "ghp_xxxxxxxxxxxx" | docker login ghcr.io -u smalltinkerlab --password-stdin
```

### Step 4: Deploy nginx Configuration

```bash
# Copy preview nginx config to server
sudo nano /etc/nginx/conf.d/tip-customer-preview.conf
```

Paste the contents from `TiP/nginx/tip-customer-preview.conf`:

```nginx
server {
    server_name www.tip.zetos.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

### Step 5: Test and Reload nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 6: Setup SSL Certificate with Let's Encrypt

```bash
# Install certbot if not already installed
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate for preview domain
sudo certbot --nginx -d www.tip.zetos.io

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 7: Verify DNS Configuration

Ensure `www.tip.zetos.io` points to your EC2 server:

```bash
# Check DNS resolution
host www.tip.zetos.io

# Should return: www.tip.zetos.io has address 52.52.21.225
```

If not configured, update your DNS records:
- **Type**: A
- **Name**: www.tip.zetos.io
- **Value**: 52.52.21.225

---

## Part 3: GitHub Repository Setup

### Step 1: Create `develop` Branch

```bash
cd ~/Documents/ParisClass/TiP

# Create and switch to develop branch
git checkout -b develop

# Push to remote
git push -u origin develop
```

### Step 2: Set Default Branch (Optional)

On GitHub:
1. Go to **Settings** → **Branches**
2. Change default branch to `develop` (recommended for active development)
3. Click **Update**

---

## Part 4: First Deployment

### Step 1: Push to `develop` Branch

```bash
cd ~/Documents/ParisClass/TiP

# Make sure you're on develop
git checkout develop

# Commit your changes
git add .
git commit -m "Add CI/CD deployment setup"

# Push to trigger deployment
git push origin develop
```

### Step 2: Monitor GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run:
   - ✅ test-and-build
   - ✅ build-and-push-docker
   - ✅ deploy-preview

### Step 3: Verify Deployment

After ~5-10 minutes, check:

```bash
# Check if container is running on EC2
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225 "docker ps | grep tip-customer"

# Check container logs
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225 "docker logs tip-customer-preview"

# Test the site
curl -I https://www.tip.zetos.io
```

Visit in browser: **https://www.tip.zetos.io**

---

## Part 5: Production Deployment (When Ready)

### Setup Production nginx (Do this when ready to launch)

```bash
# SSH to server
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225

# Create production nginx config
sudo nano /etc/nginx/conf.d/tip-customer-production.conf
```

Paste contents from `TiP/nginx/tip-customer-production.conf`, then:

```bash
# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate for production domain
sudo certbot --nginx -d www.travelinyourpocket.com -d travelinyourpocket.com
```

### Deploy to Production (Manual Trigger)

1. Go to GitHub repository → **Actions**
2. Click **TIP Customer Frontend CI/CD** workflow
3. Click **Run workflow** dropdown
4. Select:
   - **Branch**: `main` (or `develop` if you want to promote)
   - **Environment**: `production`
5. Click **Run workflow**

This will:
- Build and push Docker image with `production` tag
- **NOT auto-deploy** (manual SSH required)

### Manual Production Deployment on Server

```bash
# SSH to server
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225

# Pull production image from GitHub Container Registry
docker pull ghcr.io/dev-zetos/tip-customer:production-latest

# Stop and remove old production container (if exists)
docker stop tip-customer-production || true
docker rm tip-customer-production || true

# Run new production container on port 3001
docker run -d \
  --name tip-customer-production \
  --restart unless-stopped \
  -p 3001:3000 \
  -e NODE_ENV=production \
  ghcr.io/dev-zetos/tip-customer:production-latest

# Verify it's running
docker ps | grep tip-customer-production
docker logs -f tip-customer-production
```

Visit: **https://www.travelinyourpocket.com**

---

## Troubleshooting

### GitHub Actions Fails

**Check Secrets**:
- Verify all secrets are set correctly in GitHub repository settings
- SSH key should include BEGIN and END lines
- Docker credentials should be valid

**Check Logs**:
- Go to Actions tab → Click on failed workflow → View logs

### Docker Container Won't Start

```bash
# SSH to server
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225

# Check container status
docker ps -a | grep tip-customer

# Check logs for errors
docker logs tip-customer-preview

# Check if port is already in use
sudo ss -tlnp | grep :3000

# Restart container
docker restart tip-customer-preview
```

### nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Can't Access Site

1. **Check DNS**: `host www.tip.zetos.io` should return `52.52.21.225`
2. **Check Security Group**: Port 443 should be open to 0.0.0.0/0
3. **Check nginx**: `sudo systemctl status nginx`
4. **Check container**: `docker ps | grep tip-customer`
5. **Check logs**: `docker logs tip-customer-preview`

---

## Monitoring & Maintenance

### Check Container Health

```bash
# SSH to server
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225

# Check running containers
docker ps

# Check container resource usage
docker stats

# View logs
docker logs -f tip-customer-preview

# Check container health
docker inspect tip-customer-preview | grep -A 10 Health
```

### Update Preview Deployment

Simply push to `develop` branch:

```bash
git checkout develop
git add .
git commit -m "Your changes"
git push origin develop
```

GitHub Actions will automatically:
1. Build new Docker image
2. Deploy to preview server
3. Old container replaced with new one

### Rollback Deployment

```bash
# SSH to server
ssh -i ~/Documents/ParisClass/tip-backend/smalltinkerlab-key.pem ubuntu@52.52.21.225

# List available images
docker images | grep tip-customer

# Stop current container
docker stop tip-customer-preview
docker rm tip-customer-preview

# Run previous version (replace with actual tag)
docker run -d \
  --name tip-customer-preview \
  --restart unless-stopped \
  -p 3000:3000 \
  ghcr.io/dev-zetos/tip-customer:preview-{previous-sha}
```

---

## Workflow Summary

### Development Workflow

```
1. Work on features locally
   ↓
2. Commit and push to develop branch
   ↓
3. GitHub Actions automatically:
   - Runs tests and linting
   - Builds Docker image
   - Pushes to Docker Hub
   - Deploys to www.tip.zetos.io
   ↓
4. Test on preview site
   ↓
5. When ready for production:
   - Merge develop → main
   - Manually trigger production workflow
   - Manually deploy on server
```

### Emergency Rollback

```bash
# Quick rollback to previous version
docker restart tip-customer-preview  # If just need to restart

# Or roll back to specific version
docker stop tip-customer-preview && docker rm tip-customer-preview
docker run -d --name tip-customer-preview -p 3000:3000 {username}/tip-customer:preview-{sha}
```

---

## Next Steps

- [ ] Complete Part 1: GitHub Secrets Setup
- [ ] Complete Part 2: EC2 Server Setup
- [ ] Complete Part 3: GitHub Repository Setup
- [ ] Complete Part 4: First Deployment
- [ ] Test preview deployment at www.tip.zetos.io
- [ ] When ready: Setup production (Part 5)

---

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review GitHub Actions logs
3. Check Docker container logs on server
4. Verify nginx configuration and logs

**Document Version**: 1.0
**Last Updated**: February 15, 2026
