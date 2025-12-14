@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"

echo ==^> Stopping postgres container and removing volumes...
docker compose down -v postgres

echo ==^> Re-running setup (npm install, migrations, seeds)...
call "%SCRIPT_DIR%setup.bat"
exit /b %errorlevel%
