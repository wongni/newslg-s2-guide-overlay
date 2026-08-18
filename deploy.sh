#!/bin/bash
# deploy.sh - Idempotent deploy of Next.js app to a fresh or existing Linux server
# Usage: ./deploy.sh [HOST] [USER] [DOMAIN]
#
# Prerequisites (local): ssh, scp, tar
# Target: Any Ubuntu/Debian Linux server with SSH access

set -e

# --- Config ---
REMOTE_HOST="${1:-216.45.63.224}"
REMOTE_USER="${2:-root}"
DOMAIN="${3:-cheonha.samgukji.top}"
PORT=80
CONTAINER="s2-guide-overlay"
IMAGE="s2-guide-overlay"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"

# ============================================================
# 1. Create source archive
# ============================================================
echo ""
echo "[1/4] Creating source archive..."
tar -czf deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=deploy.tar.gz \
  .

# ============================================================
# 2. Upload to server
# ============================================================
echo "[2/4] Uploading to ${REMOTE}..."
scp deploy.tar.gz "${REMOTE}:~/"
scp scripts/remote-setup.sh "${REMOTE}:~/remote-setup.sh"
scp scripts/edge-bootstrap.sh "${REMOTE}:~/edge-bootstrap.sh"

# ============================================================
# 3. Remote setup (idempotent) - runs the same remote-setup.sh as deploy.ps1
# ============================================================
echo "[3/4] Setting up server and deploying..."
ssh "${REMOTE}" "chmod +x ~/remote-setup.sh ~/edge-bootstrap.sh && bash ~/remote-setup.sh '$CONTAINER' '$IMAGE' '$PORT' '$DOMAIN' && rm -f ~/remote-setup.sh ~/edge-bootstrap.sh"

# ============================================================
# 4. Cleanup local
# ============================================================
echo "[4/4] Cleaning up..."
rm -f deploy.tar.gz

echo ""
echo "Deploy complete!"
echo "  URL: https://${DOMAIN}"
echo "  Direct IP access is blocked."
