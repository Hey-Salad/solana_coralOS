#!/usr/bin/env bash
# Start the HeySalad CoralOS demo stack on a server.
#
# This keeps every service bound to localhost. Expose the dashboard with an SSH
# port forward or Cloudflare Tunnel instead of opening public ports.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FEED_DIR="$ROOT/examples/marketplace/feed"
WEB_DIR="$ROOT/examples/marketplace/web"

cd "$ROOT"
docker compose up -d coral

if [ ! -d "$FEED_DIR/node_modules" ]; then
  (cd "$FEED_DIR" && npm install --no-audit --no-fund)
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  (cd "$WEB_DIR" && npm install --no-audit --no-fund)
fi

cleanup() {
  jobs -p | xargs -r kill
}
trap cleanup EXIT INT TERM

(
  cd "$FEED_DIR"
  HOST=127.0.0.1 PORT=4000 CORAL_SERVER_URL=http://127.0.0.1:5555 npm start
) &
feed_pid=$!

(
  cd "$WEB_DIR"
  VITE_HOST=127.0.0.1 VITE_FEED_PROXY=http://127.0.0.1:4000 npm run build
  VITE_HOST=127.0.0.1 VITE_FEED_PROXY=http://127.0.0.1:4000 npm run preview -- --host 127.0.0.1
) &
web_pid=$!

echo "HeySalad CoralOS demo is starting."
echo "Dashboard: http://127.0.0.1:5173"
echo "Feed API:  http://127.0.0.1:4000/api/health"
echo "Coral:     http://127.0.0.1:5555/ui/console"
echo
echo "Fund the wallets and add an LLM key before clicking Start a market."

wait "$feed_pid" "$web_pid"
