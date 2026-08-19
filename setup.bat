@echo off
REM ============================================================
REM  CEWERS - First-Time Setup (Native PostgreSQL 18)
REM  Run ONCE. Uses your native Postgres + Docker for Redis/MinIO.
REM ============================================================
setlocal

cd /d "%~dp0"
set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "PGPASSWORD=Samolan123"

echo.
echo  ============================================================
echo   CEWERS - First-Time Setup
echo  ============================================================
echo.

REM --- Check prerequisites ---
where node >nul 2>&1 || ( echo  [ERROR] Node.js not found. Install from https://nodejs.org ^& pause ^& exit /b 1 )
where docker >nul 2>&1 || ( echo  [ERROR] Docker not found. Install Docker Desktop. ^& pause ^& exit /b 1 )
if not exist "%PG_BIN%\psql.exe" ( echo  [ERROR] PostgreSQL 18 not found at %PG_BIN% ^& pause ^& exit /b 1 )

REM --- Enable corepack for pnpm ---
echo  [1/7] Enabling pnpm via corepack...
call corepack enable >nul 2>&1
call corepack prepare pnpm@9.12.2 --activate >nul 2>&1

REM --- Create .env from example if missing ---
if not exist ".env" (
    echo  [2/7] Creating .env from .env.example...
    copy ".env.example" ".env" >nul
) else (
    echo  [2/7] .env already exists, skipping.
)

REM --- Create database if it doesn't exist ---
echo  [3/7] Ensuring database 'bescewers' exists...
"%PG_BIN%\psql.exe" -U postgres -h localhost -c "SELECT 1 FROM pg_database WHERE datname='bescewers'" | find "bescewers" >nul || (
    "%PG_BIN%\psql.exe" -U postgres -h localhost -c "CREATE DATABASE bescewers" >nul 2>&1
    echo      Created database bescewers.
) || echo      Database bescewers already exists.

REM --- Install dependencies ---
echo  [4/7] Installing dependencies (this takes a few minutes)...
call pnpm install
if errorlevel 1 ( echo  [ERROR] pnpm install failed. ^& pause ^& exit /b 1 )

REM --- Start Redis + MinIO via Docker (Postgres is native) ---
echo  [5/7] Starting Redis + MinIO via Docker...
call pnpm db:up
if errorlevel 1 ( echo  [ERROR] Docker startup failed. Is Docker Desktop running? ^& pause ^& exit /b 1 )

echo      Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM --- Generate Prisma client + run migrations ---
echo  [6/7] Generating Prisma client + running migrations...
call pnpm --filter @cewers/api prisma:generate
call pnpm db:migrate
if errorlevel 1 (
    echo.
    echo  [ERROR] Migration failed.
    echo  Most likely cause: PostGIS extension not installed for PostgreSQL 18.
    echo  Fix: open pgAdmin or run in psql connected to 'bescewers':
    echo       CREATE EXTENSION postgis;
    echo  If 'postgis' control file not found, install PostGIS from
    echo  https://postgis.net/windows_downloads/ then retry this script.
    echo.
    pause & exit /b 1
)

REM --- Seed the database ---
echo  [7/7] Seeding database with Benue South data...
call pnpm db:seed
if errorlevel 1 ( echo  [ERROR] Seed failed. ^& pause ^& exit /b 1 )

echo.
echo  ============================================================
echo   SETUP COMPLETE
echo  ============================================================
echo.
echo   Database:    9 LGAs, ~92 wards, 15 SOPs, 6 demo users, 40 sample incidents
echo   API (next):  run  dev.bat   then open http://localhost:4000
echo.
echo   Demo login:  phone +2348000000003  password cewers123  (Operator, Agatu)
echo.
pause
endlocal
