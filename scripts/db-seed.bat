@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Resolve paths
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
set "SEED_FILE=%PROJECT_ROOT%\db\seeds\seed.sql"
set "EXTRA_SEED_FILE=%PROJECT_ROOT%\db\seeds\candidates_small.sql"

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

if not exist "%EXTRA_SEED_FILE%" (
  echo Supplemental seed file not found at %EXTRA_SEED_FILE%
  exit /b 1
)

call :ensure_postgres_ready
if errorlevel 1 exit /b 1

echo Seeding data from %SEED_FILE% and %EXTRA_SEED_FILE%
(
  type "%SEED_FILE%"
  type "%EXTRA_SEED_FILE%"
) | docker compose exec -T "%POSTGRES_SERVICE%" psql -v ON_ERROR_STOP=1 -U "%POSTGRES_USER%" -d "%POSTGRES_DB%"
if errorlevel 1 exit /b 1

exit /b 0

:ensure_postgres_ready
echo Starting PostgreSQL container (%POSTGRES_SERVICE%) if needed...
docker compose up -d "%POSTGRES_SERVICE%"
if errorlevel 1 (
  echo Failed to start PostgreSQL container.
  exit /b 1
)

set /a attempts=30
:wait_loop
docker compose exec -T "%POSTGRES_SERVICE%" pg_isready -U "%POSTGRES_USER%" -d "%POSTGRES_DB%" >nul 2>&1
if not errorlevel 1 (
  echo PostgreSQL is ready.
  exit /b 0
)
set /a attempts-=1
if !attempts! LEQ 0 (
  echo PostgreSQL container did not become ready in time.
  exit /b 1
)
timeout /t 2 >nul
goto :wait_loop
