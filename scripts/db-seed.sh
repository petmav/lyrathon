#!/usr/bin/env sh

set -eu

SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_PATH}/.." && pwd)"
SEED_FILE="${PROJECT_ROOT}/db/seeds/seed.sql"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-lyrathon}"
POSTGRES_DB="${POSTGRES_DB:-lyrathon}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run seeds."
  exit 1
fi

if [ ! -f "${SEED_FILE}" ]; then
  echo "Seed file not found at ${SEED_FILE}"
  exit 1
fi

ensure_container_ready() {
  echo "Starting PostgreSQL container (${POSTGRES_SERVICE}) if needed..."
  docker compose up -d "${POSTGRES_SERVICE}"

  echo "Waiting for PostgreSQL to accept connections..."
  attempts=30
  until docker compose exec -T "${POSTGRES_SERVICE}" pg_isready \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" >/dev/null 2>&1; do
    attempts=$((attempts - 1))
    if [ "${attempts}" -le 0 ]; then
      echo "PostgreSQL container did not become ready in time."
      exit 1
    fi
    sleep 2
  done
}

ensure_container_ready

echo "Seeding data from ${SEED_FILE}"
docker compose exec -T "${POSTGRES_SERVICE}" psql \
  -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" < "${SEED_FILE}"
