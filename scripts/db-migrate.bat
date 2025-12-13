@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Resolve paths
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
set "MIGRATIONS_DIR=%PROJECT_ROOT%\db\migrations"

REM Defaults (match sh scripts)
if not defined POSTGRES_SERVICE set "POSTGRES_SERVICE=postgres"
if not defined POSTGRES_USER set "POSTGRES_USER=lyrathon"
if not defined POSTGRES_DB set "POSTGRES_DB=lyrathon"

REM Check docker exists
where docker >nul 2>&1
if errorlevel 1 (
  echo Docker is required to run migrations.
  exit /b 1
)

REM Check container is running
docker compose ps "%POSTGRES_SERVICE%" >nul 2>&1
if errorlevel 1 (
  echo PostgreSQL container "%POSTGRES_SERVICE%" is not running. Start it with: docker compose up -d %POSTGRES_SERVICE%
  exit /b 1
)

REM Ensure migrations exist
if not exist "%MIGRATIONS_DIR%\*.sql" (
  echo No migration files found in %MIGRATIONS_DIR%
  exit /b 0
)

REM Apply migrations in alphabetical order
for %%F in ("%MIGRATIONS_DIR%\*.sql") do (
  echo Applying %%~nxF
  docker compose exec -T "%POSTGRES_SERVICE%" psql -v ON_ERROR_STOP=1 -U "%POSTGRES_USER%" -d "%POSTGRES_DB%" < "%%~fF"
  if errorlevel 1 exit /b 1
)

exit /b 0
