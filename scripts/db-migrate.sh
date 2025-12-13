#!/usr/bin/env sh

set -eu

SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_PATH}/.." && pwd)"
MIGRATIONS_DIR="${PROJECT_ROOT}/db/migrations"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-lyrathon}"
POSTGRES_DB="${POSTGRES_DB:-lyrathon}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run migrations."
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

set -- "${MIGRATIONS_DIR}"/*.sql
if [ "$1" = "${MIGRATIONS_DIR}/*.sql" ]; then
  echo "No migration files found in ${MIGRATIONS_DIR}"
  exit 0
fi

for migration in "$@"; do
  echo "Applying ${migration##*/}"
  docker compose exec -T "${POSTGRES_SERVICE}" psql \
    -v ON_ERROR_STOP=1 \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" < "${migration}"
done
