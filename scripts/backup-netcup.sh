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

tar -czf "$BACKUP_DIR/toolcompare-$STAMP.tar.gz" --absolute-names "${items[@]}"
find "$BACKUP_DIR" -type f -name 'toolcompare-*.tar.gz' -mtime +14 -delete
echo "backup: $BACKUP_DIR/toolcompare-$STAMP.tar.gz"
