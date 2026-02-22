#!/bin/bash
# TiP Customer Frontend — One-time repo setup after cloning.
# Run this once: ./repo-initial-setup.sh

set -e

echo "=========================================="
echo "TiP Customer Frontend — Repo Initial Setup"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# --- Git hooks ---
echo "Configuring git hooks..."
git config core.hooksPath .githooks
echo -e "${GREEN}✓ Git hooks configured (.githooks/)${NC}"
echo ""

# --- GPG ---
echo "Checking for GPG..."
if ! command -v gpg &> /dev/null; then
    echo -e "${YELLOW}GPG not found. Installing...${NC}"
    brew install gnupg
    echo -e "${GREEN}✓ GPG installed${NC}"
else
    echo -e "${GREEN}✓ GPG found${NC}"
fi
echo ""

# --- Passphrase file ---
echo "Checking for secrets/.passphrase..."
if [ ! -f "secrets/.passphrase" ]; then
    echo -e "${YELLOW}⚠️  secrets/.passphrase not found.${NC}"
    echo "   Get the passphrase from your team / 1Password and create the file:"
    echo ""
    echo "     echo 'YOUR_PASSPHRASE' > secrets/.passphrase"
    echo "     chmod 600 secrets/.passphrase"
    echo ""
else
    echo -e "${GREEN}✓ Passphrase file found${NC}"
fi

echo "=========================================="
echo -e "${GREEN}Repo setup complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Ensure secrets/.passphrase is in place (see above if missing)"
echo "  2. Run npm install to install dependencies"
echo "  3. Copy .env.local.example to .env.local and fill in local values"
echo ""
