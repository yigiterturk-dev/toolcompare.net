#!/usr/bin/env bash
# Netcup deploy: pull main, install, build, restart the systemd unit.
# Run on the server as root (see docs/deploy-netcup.md).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/toolcompare.net}"
cd "$APP_DIR"

git fetch origin main
git reset --hard origin/main
npm ci --no-audit --no-fund
npm run build
systemctl restart toolcompare
systemctl --no-pager --lines=5 status toolcompare
