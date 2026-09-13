#!/bin/bash
echo "==================================================="
echo "       Starting DocSurgical AI Web Application     "
echo "==================================================="

# Start backend
echo "[1/2] Launching FastAPI Backend on http://localhost:8000..."
cd backend && uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "[2/2] Launching Next.js Frontend on http://localhost:3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "==================================================="
echo "DocSurgical AI is running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000/docs"
echo "==================================================="

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
