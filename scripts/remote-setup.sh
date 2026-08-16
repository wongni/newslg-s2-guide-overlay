#!/bin/bash
# remote-setup.sh - Idempotent server setup and deploy
# This script is uploaded and executed by deploy.ps1
# Args: $1=CONTAINER $2=IMAGE $3=PORT $4=DOMAIN
set -e

CONTAINER="${1:-s2-guide-overlay}"
IMAGE="${2:-s2-guide-overlay}"
PORT="${3:-80}"
DOMAIN="${4:-sam.wongni.xyz}"

echo '>>> [1/5] Installing Docker if needed...'
if ! command -v docker &> /dev/null; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin
  systemctl enable docker
  systemctl start docker
  echo '    Docker installed.'
else
  echo '    Docker already installed.'
fi

echo '>>> [2/5] Installing iptables-persistent if needed...'
if ! command -v netfilter-persistent &> /dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent
  echo '    iptables-persistent installed.'
else
  echo '    iptables-persistent already installed.'
fi

echo '>>> [3/5] Deploying application...'
rm -rf ~/s2-guide-overlay
mkdir -p ~/s2-guide-overlay
cd ~/s2-guide-overlay
tar -xzf ~/deploy.tar.gz
rm -f ~/deploy.tar.gz

# Stop and remove old container (idempotent)
docker stop "$CONTAINER" 2>/dev/null || true
docker rm "$CONTAINER" 2>/dev/null || true

# Build image
docker build -t "$IMAGE" .

# Run container
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "${PORT}:3000" \
  "$IMAGE"

echo '>>> [4/5] Configuring firewall (Cloudflare only)...'

# Cloudflare IPv4 ranges - https://www.cloudflare.com/ips-v4/
CF_IPS=(
  173.245.48.0/20
  103.21.244.0/22
  103.22.200.0/22
  103.31.4.0/22
  141.101.64.0/18
  108.162.192.0/18
  190.93.240.0/20
  188.114.96.0/20
  197.234.240.0/22
  198.41.128.0/17
  162.158.0.0/15
  104.16.0.0/13
  104.24.0.0/14
  172.64.0.0/13
  131.0.72.0/22
)

# DOCKER-USER chain controls traffic to Docker-published ports
iptables -F DOCKER-USER

# Allow Cloudflare IPs to reach the container
for ip in "${CF_IPS[@]}"; do
  iptables -A DOCKER-USER -p tcp --dport 3000 -s "$ip" -j ACCEPT
done

# Allow localhost
iptables -A DOCKER-USER -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT

# Drop everything else to container port
iptables -A DOCKER-USER -p tcp --dport 3000 -j DROP

# Pass through all other traffic
iptables -A DOCKER-USER -j RETURN

# Persist rules across reboot
netfilter-persistent save

echo '>>> [5/5] Verifying...'
if docker ps --filter "name=$CONTAINER" --filter "status=running" | grep -q "$CONTAINER"; then
  echo ''
  echo '============================================'
  echo "  Deploy SUCCESS: https://${DOMAIN}"
  echo "  Container: ${CONTAINER} (port ${PORT}:3000)"
  echo "  Firewall: Cloudflare IPs only"
  echo '============================================'
else
  echo 'ERROR: Container not running!'
  docker logs "$CONTAINER" --tail 20
  exit 1
fi
