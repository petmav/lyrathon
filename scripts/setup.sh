#!/usr/bin/env sh

set -eu

SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_PATH}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_TEMPLATE="${PROJECT_ROOT}/.env.example"

echo "==> Verifying prerequisites..."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop or the CLI before running setup."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js 18+ which bundles npm."
  exit 1
fi

echo "==> Installing Node dependencies (npm install)..."
cd "${PROJECT_ROOT}"
npm install

if [ ! -f "${ENV_FILE}" ] && [ -f "${ENV_TEMPLATE}" ]; then
  echo "==> Creating .env from .env.example (please update secrets afterwards)..."
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"
fi

echo "==> Starting PostgreSQL container (pgvector)..."
docker compose up -d postgres

echo "==> Running database migrations..."
"${SCRIPT_PATH}/db-migrate.sh"

echo "==> Seeding sample data..."
"${SCRIPT_PATH}/db-seed.sh"

cat <<'EOM'

Setup complete!

Next steps:
  1. Update .env with your OPENAI_* keys and any overrides.
  2. Start the Next.js dev server with: npm run dev
  3. Explore endpoints at http://localhost:3000

EOM
