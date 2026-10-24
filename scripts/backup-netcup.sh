#!/usr/bin/env bash
# Daily backup of the pieces that git does not own: price history, subscribers,
# local env, Caddyfile and the deploy units.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/toolcompare.net}"
DATA_DIR="${DATA_DIR:-/opt/toolcompare-data}"
BACKUP_DIR="${BACKUP_DIR:-/opt/toolcompare-backups}"
STAMP="$(date +%F-%H%M)"
mkdir -p "$BACKUP_DIR"

items=("$DATA_DIR")
[ -f "$APP_DIR/src/data/subscribers.json" ] && items+=("$APP_DIR/src/data/subscribers.json")
[ -f "$APP_DIR/.env.production" ] && items+=("$APP_DIR/.env.production")
[ -f /opt/legafetch/caddy/Caddyfile ] && items+=(/opt/legafetch/caddy/Caddyfile)
[ -f /etc/systemd/system/toolcompare.service ] && items+=(/etc/systemd/system/toolcompare.service)
[ -f /etc/systemd/system/toolcompare-autodeploy.service ] && items+=(/etc/systemd/system/toolcompare-autodeploy.service)
[ -f /etc/systemd/system/toolcompare-autodeploy.timer ] && items+=(/etc/systemd/system/toolcompare-autodeploy.timer)

ARCHIVE="$BACKUP_DIR/toolcompare-$STAMP.tar.gz"
tar -czf "$ARCHIVE" --absolute-names "${items[@]}"
find "$BACKUP_DIR" -type f -name 'toolcompare-*.tar.gz' -mtime +14 -delete

# Offsite: ayni hesaptaki hetzner sunucusu. Ulasilamazsa yerel yedek kalir.
OFFSITE_HOST="${OFFSITE_HOST:-root@89.167.52.36}"
OFFSITE_DIR="${OFFSITE_DIR:-/opt/toolcompare-backups}"
OFFSITE_KEY="${OFFSITE_KEY:-/root/.ssh/hetzner_tun}"
SSH_CMD="ssh -i $OFFSITE_KEY -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new"
if $SSH_CMD "$OFFSITE_HOST" "mkdir -p '$OFFSITE_DIR'" >/dev/null 2>&1; then
  if rsync -az -e "$SSH_CMD" "$ARCHIVE" "$OFFSITE_HOST:$OFFSITE_DIR/"; then
    $SSH_CMD "$OFFSITE_HOST" "find '$OFFSITE_DIR' -type f -name 'toolcompare-*.tar.gz' -mtime +30 -delete" >/dev/null 2>&1 || true
    echo "offsite: $OFFSITE_HOST:$OFFSITE_DIR/$(basename "$ARCHIVE")"
  else
    echo "offsite copy failed; local backup kept: $ARCHIVE"
  fi
else
  echo "offsite host unreachable; local backup kept: $ARCHIVE"
fi
echo "backup: $ARCHIVE"
