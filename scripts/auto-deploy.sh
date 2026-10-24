#!/usr/bin/env bash
# systemd timer entry point: deploy only when origin/main moved.
set -euo pipefail

cd /opt/toolcompare.net
git fetch origin main --quiet
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  exit 0
fi

exec ./scripts/deploy-netcup.sh
