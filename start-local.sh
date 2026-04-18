#!/usr/bin/env bash
# ============================================================
# Start ekap-react-mfe for local development
#   Infrastructure + backends: Docker (ports shifted +100)
#   Frontend dev servers: Webpack (ports 4000 and 4001)
# ============================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

COMPOSE_ARGS="-f docker-compose.yml -f docker-compose.local.yml"
export COMPOSE_PROJECT_NAME=ekap-react

cleanup() {
  echo ""
  echo "Shutting down ekap-react-mfe..."
  [[ -n "${SHELL_PID:-}" ]] && kill "$SHELL_PID" 2>/dev/null || true
  [[ -n "${HR_PID:-}" ]]    && kill "$HR_PID"    2>/dev/null || true
  docker compose $COMPOSE_ARGS down
}
trap cleanup EXIT INT TERM

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "⚠  Copied .env.example → .env  — add your ANTHROPIC_API_KEY before first use."
fi

echo "▶  Starting infrastructure and backend services (ports shifted to avoid conflicts)..."
docker compose $COMPOSE_ARGS up -d \
  postgres redis zookeeper kafka minio weaviate chat-service hr-service

for dir in frontend/remotes/hr-namechange frontend/shell; do
  if [[ ! -d "$REPO_DIR/$dir/node_modules" ]]; then
    echo "▶  Installing $dir dependencies..."
    (cd "$REPO_DIR/$dir" && npm install)
  fi
done

echo "▶  Starting Webpack dev servers..."
# HR namechange remote first (shell depends on it for Module Federation)
(cd "$REPO_DIR/frontend/remotes/hr-namechange" && npm run dev -- --port 4001 2>&1 | sed 's/^/[hr-namechange] /') &
HR_PID=$!

sleep 3  # give the remote a moment to compile

(cd "$REPO_DIR/frontend/shell" && \
  CHAT_SERVICE_URL=http://localhost:8100 \
  HR_NAMECHANGE_URL=http://localhost:4001/remoteEntry.js \
  npm run dev -- --port 4000 2>&1 | sed 's/^/[shell]        /') &
SHELL_PID=$!

echo ""
echo "✅ ekap-react-mfe is starting up"
echo "   Chat shell:    http://localhost:4000"
echo "   HR namechange: http://localhost:4001"
echo "   Chat API:      http://localhost:8100"
echo ""
echo "Press Ctrl+C to stop."
wait
