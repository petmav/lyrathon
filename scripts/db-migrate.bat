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

call :ensure_postgres_ready
if errorlevel 1 exit /b 1

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