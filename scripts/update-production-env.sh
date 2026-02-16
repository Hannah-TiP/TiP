#!/bin/bash

# Update Production Environment Variables Script
# This script copies env files to production server and restarts the Docker containers

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="${EC2_HOST:-52.52.21.225}"
SERVER_USER="${EC2_USER:-ubuntu}"
SSH_KEY="${EC2_SSH_KEY:-$HOME/Documents/ParisClass/smalltinkerlab-key.pem}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TIP Production Environment Update Script    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Check if env files exist
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi

if [ ! -f ".env.preview" ]; then
    echo -e "${RED}❌ Error: .env.preview file not found${NC}"
    exit 1
fi

# Check if SSH key exists
if [ ! -f "${SSH_KEY}" ]; then
    echo -e "${RED}❌ Error: SSH key not found at ${SSH_KEY}${NC}"
    exit 1
fi

# Ensure SSH key has correct permissions
chmod 600 "${SSH_KEY}" 2>/dev/null || true

# Display current configuration
echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "   Server: ${SERVER_USER}@${SERVER_HOST}"
echo -e "   SSH Key: ${SSH_KEY}"
echo ""

# Confirm with user
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📤 Step 1: Copying environment files to server...${NC}"

# Copy production env file
echo -e "${GREEN}   → Copying .env.production${NC}"
scp -i "${SSH_KEY}" .env.production "${SERVER_USER}@${SERVER_HOST}:~/.env.production"

# Copy preview env file
echo -e "${GREEN}   → Copying .env.preview${NC}"
scp -i "${SSH_KEY}" .env.preview "${SERVER_USER}@${SERVER_HOST}:~/.env.preview"

echo -e "${GREEN}✅ Environment files copied successfully${NC}"
echo ""

echo -e "${BLUE}🔄 Step 2: Restarting Docker containers...${NC}"

# SSH into server and restart containers
ssh -i "${SSH_KEY}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
    echo "   → Restarting production container..."
    docker stop tip-customer-production 2>/dev/null || true
    docker rm tip-customer-production 2>/dev/null || true

    # Get the latest production image tag
    PROD_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "tip-customer:production-latest" | head -n 1)

    if [ -z "$PROD_IMAGE" ]; then
        echo "   ⚠️  No production image found. Please deploy first."
    else
        docker run -d \
          --name tip-customer-production \
          --restart unless-stopped \
          -p 9201:3000 \
          --env-file ~/.env.production \
          "$PROD_IMAGE"

        echo "   ✅ Production container restarted"
    fi

    echo ""
    echo "   → Restarting preview container..."
    docker stop tip-customer-preview 2>/dev/null || true
    docker rm tip-customer-preview 2>/dev/null || true

    # Get the latest preview image tag
    PREVIEW_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "tip-customer:preview-latest" | head -n 1)

    if [ -z "$PREVIEW_IMAGE" ]; then
        echo "   ⚠️  No preview image found. Please deploy first."
    else
        docker run -d \
          --name tip-customer-preview \
          --restart unless-stopped \
          -p 9200:3000 \
          --env-file ~/.env.preview \
          "$PREVIEW_IMAGE"

        echo "   ✅ Preview container restarted"
    fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Your sites:${NC}"
echo -e "   Production: https://www.travelinyourpocket.com"
echo -e "   Preview: https://www.tip.zetos.io"
echo ""
echo -e "${YELLOW}💡 Tip: The 'Not Secure' warning should now be fixed!${NC}"
