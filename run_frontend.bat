@echo off
title Reloop React Frontend (Vite)
cd /d "%~dp0"

echo ======================================================
echo Starting Reloop Frontend (Vite)
echo ======================================================

IF NOT EXIST "node_modules" (
    echo Installing npm packages...
    npm install
)

echo.
echo Starting Vite development server...
echo Frontend will run on: http://localhost:5173
echo ======================================================
npm run dev -- --host 127.0.0.1

pause
