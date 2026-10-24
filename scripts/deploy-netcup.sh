#!/usr/bin/env bash
# Netcup deploy: pull main, refresh price history, install, build, restart.
# Run on the server as root (see docs/deploy-netcup.md).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/toolcompare.net}"
DATA_DIR="${DATA_DIR:-/opt/toolcompare-data}"
LOCK_FILE="/var/lock/toolcompare-deploy.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another ToolCompare deploy is already running; skipping."
  exit 0
fi

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

# Fiyat gecmisi repo'da degil, sunucuda yasar: deploy her seferinde repo
# baseline'ini ezer, bu yuzden once disaridaki kopyayi geri koyup uzerine
# yeni snapshot'i yaziyoruz. Boylece GitHub Actions'a ihtiyac kalmaz.
mkdir -p "$DATA_DIR/arsiv"
if [ -f "$DATA_DIR/fiyat-gecmisi.json" ]; then
  cp "$DATA_DIR/fiyat-gecmisi.json" src/data/fiyat-gecmisi.json
fi
npm run fiyat:gecmis
cp src/data/fiyat-gecmisi.json "$DATA_DIR/fiyat-gecmisi.json"
cp src/data/fiyat-gecmisi.json "$DATA_DIR/arsiv/fiyat-gecmisi-$(date +%F).json"
find "$DATA_DIR/arsiv" -type f -name 'fiyat-gecmisi-*.json' -mtime +60 -delete

npm ci --no-audit --no-fund
# Testler build'den once: kod hatasi varsa canliya dokunmadan cik.
npm test
npm run build
systemctl restart toolcompare
systemctl --no-pager --lines=5 status toolcompare
