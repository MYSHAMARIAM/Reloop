@echo off
title Reloop FastAPI Backend (Port 8000)
cd /d "%~dp0backend"

echo ======================================================
echo Starting Reloop FastAPI Server (Port 8000)
echo ======================================================

IF NOT EXIST "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Launching Uvicorn server with auto-reload...
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ======================================================
python run_server.py

pause
