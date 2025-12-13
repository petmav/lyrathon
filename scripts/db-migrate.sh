#!/usr/bin/env sh

set -eu

SCRIPT_PATH="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_PATH}/.." && pwd)"
MIGRATIONS_DIR="${PROJECT_ROOT}/db/migrations"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-lyrathon}"
POSTGRES_DB="${POSTGRES_DB:-lyrathon}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run migrations."
  exit 1
fi

if ! docker compose ps "${POSTGRES_SERVICE}" >/dev/null 2>&1; then
  echo "PostgreSQL container \"${POSTGRES_SERVICE}\" is not running. Start it with: docker compose up -d ${POSTGRES_SERVICE}"
  exit 1
fi

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
