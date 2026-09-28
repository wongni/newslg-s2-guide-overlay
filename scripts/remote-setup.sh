#!/bin/bash
# remote-setup.sh - Idempotent server setup and deploy
# This script is uploaded and executed by deploy.ps1
# Args: $1=CONTAINER $2=IMAGE $3=PORT(unused) $4=DOMAIN
#
# The app runs behind a shared Caddy reverse proxy (edge-net) that owns host
# port 80 and routes by hostname. This container does NOT publish a host port;
# Caddy reaches it by container name over the shared network.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER="${1:-s2-guide-overlay}"
IMAGE="${2:-s2-guide-overlay}"
PORT="${3:-80}"          # kept for backward-compat; no longer used for binding
DOMAIN="${4:-cheonha.samgukji.top}"
EDGE_NET="edge-net"

# Shared, idempotent host infra (Docker + edge-net). See scripts/edge-bootstrap.sh.
echo '>>> [1/5] Bootstrapping shared edge infrastructure...'
# shellcheck source=edge-bootstrap.sh
source "$SCRIPT_DIR/edge-bootstrap.sh"
edge_bootstrap

echo '>>> [2/4] Deploying application...'
rm -rf ~/s2-guide-overlay
mkdir -p ~/s2-guide-overlay
cd ~/s2-guide-overlay
tar -xzf ~/deploy.tar.gz
rm -f ~/deploy.tar.gz

# Place .env file (uploaded separately)
if [ -f ~/s2-env-temp ]; then
  mv ~/s2-env-temp ~/s2-guide-overlay/.env
fi

# Stop and remove old container (idempotent)
docker stop "$CONTAINER" 2>/dev/null || true
docker rm "$CONTAINER" 2>/dev/null || true

# Build image
docker build -t "$IMAGE" .

# Run container on the shared edge network WITHOUT publishing a host port.
# The shared Caddy proxy forwards ${DOMAIN} -> ${CONTAINER}:3000 internally.
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --network "$EDGE_NET" \
  -v /root/s2-data:/app/data \
  --env-file /root/s2-guide-overlay/.env \
  "$IMAGE"

echo '>>> [3/4] Firewall: leaving DOCKER-USER untouched...'
# This container no longer publishes a host port, so it needs no firewall rule.
# Install/refresh periodic data backup (cron)
echo '>>> [3b] Installing periodic data backup...'
if [ -f ~/backup-data.sh ]; then
  mkdir -p /root/bin
  mv -f ~/backup-data.sh /root/bin/backup-data.sh
  chmod +x /root/bin/backup-data.sh
  # Idempotent cron entry: hourly snapshot of /root/s2-data -> /root/s2-backups.
  # Build via a temp file (robust under `set -e`; piping `crontab -l | grep`
  # fails when the crontab is empty because grep returns exit 1).
  CRON_CMD="/root/bin/backup-data.sh /root/s2-data /root/s2-backups 168 >> /root/s2-backup.log 2>&1"
  CRON_LINE="0 * * * * $CRON_CMD"
  TMP_CRON="$(mktemp)"
  # Preserve any existing entries except our own, then append the current one.
  crontab -l 2>/dev/null | grep -v 'backup-data.sh' > "$TMP_CRON" || true
  echo "$CRON_LINE" >> "$TMP_CRON"
  crontab "$TMP_CRON"
  rm -f "$TMP_CRON"
  if crontab -l 2>/dev/null | grep -q 'backup-data.sh'; then
    echo "    Cron installed: hourly backup to /root/s2-backups"
  else
    echo "    WARNING: cron registration could not be verified."
  fi
  # Take one immediate backup so we always have a baseline.
  /root/bin/backup-data.sh /root/s2-data /root/s2-backups 168 >> /root/s2-backup.log 2>&1 || true
else
  echo '    WARNING: backup-data.sh not uploaded; skipping backup setup.'
fi

# The shared proxy owns :80 and manages the Cloudflare-only allowlist; do NOT
# flush DOCKER-USER here or it would wipe the proxy's rules.
if ! docker ps --filter 'name=edge-caddy' --filter 'status=running' | grep -q edge-caddy; then
  echo '    WARNING: edge-caddy proxy not found. This app is only reachable'
  echo '             once the shared Caddy proxy (edge-net, :80) is running.'
else
  echo '    edge-caddy proxy detected; routing handled by proxy.'
fi

echo '>>> [4/4] Verifying...'
if docker ps --filter "name=$CONTAINER" --filter "status=running" | grep -q "$CONTAINER"; then
  echo ''
  echo '============================================'
  echo "  Deploy SUCCESS: https://${DOMAIN}"
  echo "  Container: ${CONTAINER} on ${EDGE_NET} (no host port)"
  echo "  Routing:   via shared edge-caddy proxy (:80)"
  echo '============================================'
else
  echo 'ERROR: Container not running!'
  docker logs "$CONTAINER" --tail 20
  exit 1
fi
