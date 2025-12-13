#!/usr/bin/env sh

set -eu

SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_PATH}/.." && pwd)"

echo "==> Stopping postgres container and removing volumes..."
docker compose down -v postgres || true

echo "==> Re-running setup (npm install, migrations, seeds)..."
"${SCRIPT_PATH}/setup.sh"
