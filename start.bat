@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo       Starting StructraMorph.ai Web Application
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start "StructraMorph Backend (FastAPI)" cmd /k "cd /d \"%~dp0backend\" && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Next.js Frontend on http://localhost:3000...
start "StructraMorph Frontend (Next.js)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo ===================================================
echo StructraMorph.ai is starting!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
