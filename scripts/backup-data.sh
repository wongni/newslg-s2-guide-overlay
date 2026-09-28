#!/bin/bash
# backup-data.sh - Periodic snapshot of the scout/app data volume.
#
# Runs on the server (installed via remote-setup.sh as a cron job).
# Creates a timestamped tarball of /root/s2-data and rotates old ones.
#
# Rationale: data/scout.json is writable by anyone with the passcode, so a
# malicious user could wipe or poison it. The app already snapshots each write
# (data/backups/scout/...), but this provides an independent, off-process copy
# in case the whole data dir is lost or corrupted.
set -euo pipefail

DATA_DIR="${1:-/root/s2-data}"
BACKUP_DIR="${2:-/root/s2-backups}"
MAX_BACKUPS="${3:-168}"   # keep ~1 week if run hourly

mkdir -p "$BACKUP_DIR"

if [ ! -d "$DATA_DIR" ]; then
  echo "[backup-data] data dir $DATA_DIR not found; nothing to back up." >&2
  exit 0
fi

TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/s2-data-$TS.tar.gz"

# Create the snapshot. -C so paths inside the tar are relative.
tar -czf "$DEST" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
echo "[backup-data] wrote $DEST"

# Rotate: keep only the newest $MAX_BACKUPS archives.
mapfile -t ARCHIVES < <(ls -1t "$BACKUP_DIR"/s2-data-*.tar.gz 2>/dev/null || true)
if [ "${#ARCHIVES[@]}" -gt "$MAX_BACKUPS" ]; then
  for old in "${ARCHIVES[@]:$MAX_BACKUPS}"; do
    rm -f "$old"
    echo "[backup-data] pruned $old"
  done
fi
