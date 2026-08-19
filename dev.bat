@echo off
REM ============================================================
REM  CEWERS - Development Server (Native PostgreSQL 18)
REM  Starts API + Console in parallel.
REM ============================================================
setlocal

cd /d "%~dp0"
set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "PGPASSWORD=Samolan123"

echo.
echo  ============================================================
echo   CEWERS - Development Server
echo  ============================================================
echo.

REM --- Verify Postgres is reachable ---
"%PG_BIN%\psql.exe" -U postgres -h localhost -d bescewers -c "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Cannot connect to PostgreSQL 'bescewers'.
    echo  Check that the PostgreSQL 18 service is running and credentials in .env are correct.
    pause & exit /b 1
)

REM --- Verify Redis is up (Docker) ---
docker ps --format "{{.Names}}" | findstr "cewers-redis" >nul || (
    echo  [WARN] cewers-redis not running. Starting Redis + MinIO via Docker...
    call pnpm db:up
    timeout /t 4 /nobreak >nul
)

echo  Starting API + Console...
echo   - API:     http://localhost:4000
echo   - Console: http://localhost:5163
echo.
echo  Press Ctrl+C in each window to stop.
echo.

start "CEWERS API" cmd /c "cd /d %~dp0 && pnpm dev:api"
timeout /t 3 /nobreak >nul
start "CEWERS Console" cmd /c "cd /d %~dp0 && pnpm dev:console"

echo  Dev servers launched in new windows.
pause
endlocal
