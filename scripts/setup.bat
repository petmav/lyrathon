@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
set "ENV_FILE=%PROJECT_ROOT%\.env"
set "ENV_TEMPLATE=%PROJECT_ROOT%\.env.example"

echo ==^> Verifying prerequisites...
where docker >nul 2>&1
if errorlevel 1 (
  echo Docker is required. Install Docker Desktop/CLI first.
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm is required. Install Node.js 18+ which bundles npm.
  exit /b 1
)

echo ==^> Installing Node dependencies (npm install)...
pushd "%PROJECT_ROOT%"
npm install
if errorlevel 1 (
  popd
  exit /b 1
)
popd

if not exist "%ENV_FILE%" if exist "%ENV_TEMPLATE%" (
  echo ==^> Creating .env from .env.example (remember to edit secrets)...
  copy "%ENV_TEMPLATE%" "%ENV_FILE%" >nul
)

echo ==^> Starting PostgreSQL container (pgvector)...
docker compose up -d postgres
if errorlevel 1 (
  echo Failed to start postgres container.
  exit /b 1
)

echo ==^> Running database migrations...
call "%SCRIPT_DIR%db-migrate.bat"
if errorlevel 1 exit /b 1

echo ==^> Seeding sample data...
call "%SCRIPT_DIR%db-seed.bat"
if errorlevel 1 exit /b 1

echo.
echo Setup complete!
echo.
echo Next steps:
echo   1. Update .env with your OPENAI_* keys and custom config.
echo   2. Start the dev server: npm run dev
echo   3. Visit http://localhost:3000
echo.

exit /b 0
