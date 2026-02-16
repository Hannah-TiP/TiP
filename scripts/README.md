# TIP Deployment Scripts

This directory contains deployment and maintenance scripts for the TIP Customer Frontend.

## Available Scripts

### `update-production-env.sh`

Updates environment variables on the production server and restarts Docker containers.

**Usage:**

```bash
# From the TiP directory
npm run update-production-env
```

**What it does:**
1. Copies `.env.production` and `.env.preview` files to the server
2. Restarts the production Docker container with new environment variables
3. Restarts the preview Docker container with new environment variables

**Prerequisites:**
- SSH access to the production server (52.52.21.225)
- `.env.production` and `.env.preview` files must exist in the TiP directory
- SSH key at `~/Documents/ParisClass/smalltinkerlab-key.pem`

**Configuration:**

You can override default values using environment variables:

```bash
EC2_HOST=your-server-ip EC2_USER=your-username npm run update-production-env
```

**Environment Variables:**
- `EC2_HOST` - Server IP address (default: 52.52.21.225)
- `EC2_USER` - SSH username (default: ubuntu)
- `EC2_SSH_KEY` - Path to SSH private key (default: ~/Documents/ParisClass/smalltinkerlab-key.pem)

**Example:**

```bash
cd TiP

# Edit environment files
nano .env.production
nano .env.preview

# Deploy changes
npm run update-production-env
```

## When to Use

Run `update-production-env` whenever you need to:
- Update API endpoints (e.g., switching from HTTP to HTTPS)
- Update Google Maps API keys
- Change S3 bucket configuration
- Update any other environment variables

**Note:** This script does NOT rebuild or redeploy the Docker image. It only updates environment variables and restarts existing containers. For code changes, use the GitHub Actions CI/CD pipeline.
