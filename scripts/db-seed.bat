@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Resolve paths
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
set "SEED_FILE=%PROJECT_ROOT%\db\seeds\seed.sql"

REM Defaults (match sh scripts)
if not defined POSTGRES_SERVICE set "POSTGRES_SERVICE=postgres"
if not defined POSTGRES_USER set "POSTGRES_USER=lyrathon"
if not defined POSTGRES_DB set "POSTGRES_DB=lyrathon"

REM Check docker exists
where docker >nul 2>&1
if errorlevel 1 (
  echo Docker is required to run seeds.
  exit /b 1
)

REM Check seed file exists
if not exist "%SEED_FILE%" (
  echo Seed file not found at %SEED_FILE%
  exit /b 1
)

REM Check container is running
docker compose ps "%POSTGRES_SERVICE%" >nul 2>&1
if errorlevel 1 (
  echo PostgreSQL container "%POSTGRES_SERVICE%" is not running. Start it with: docker compose up -d %POSTGRES_SERVICE%
  exit /b 1
)

echo Seeding data from %SEED_FILE%
docker compose exec -T "%POSTGRES_SERVICE%" psql -v ON_ERROR_STOP=1 -U "%POSTGRES_USER%" -d "%POSTGRES_DB%" < "%SEED_FILE%"
if errorlevel 1 exit /b 1

exit /b 0
