#!/bin/bash
# edge-bootstrap.sh - Shared, idempotent host infrastructure for the shared
# edge proxy setup.
#
# Responsibilities (install-if-missing, safe to run repeatedly):
#   1. Docker engine + compose plugin
#   2. Shared docker network 'edge-net' (the reverse proxy + all apps join it)
#
# This file is intentionally thin and effectively immutable. It is duplicated
# verbatim across app repos (ees, s2, ...). When a third app appears, this exact
# file can be lifted into a dedicated 'edge-infra' repo without changes,
# promoting the setup from strategy A (duplication) to C (single source).
#
# Usage: source or execute. Exposes edge_bootstrap() and runs it when executed
# directly.
set -e

EDGE_NET="${EDGE_NET:-edge-net}"

edge_bootstrap() {
  echo '>>> [edge] Ensuring Docker + compose plugin...'
  if ! command -v docker &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo '    Docker installed.'
  else
    echo '    Docker already installed.'
    if ! docker compose version &> /dev/null; then
      apt-get update -qq && apt-get install -y -qq docker-compose-plugin
      echo '    compose plugin installed.'
    fi
  fi

  echo ">>> [edge] Ensuring shared network '${EDGE_NET}'..."
  if ! docker network inspect "$EDGE_NET" &> /dev/null; then
    docker network create "$EDGE_NET"
    echo "    Created network $EDGE_NET."
  else
    echo "    Network $EDGE_NET already exists."
  fi
}

# Run when executed directly (not when sourced).
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  edge_bootstrap
fi
