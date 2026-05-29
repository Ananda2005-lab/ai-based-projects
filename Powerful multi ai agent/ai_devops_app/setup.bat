@echo off
REM AI DevOps - Quick Start Script for Windows

echo.
echo ======================================
echo   AI DevOps - Quick Start Setup
echo ======================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ======================================
echo   Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Make sure Git is installed: https://git-scm.com/download/win
echo 2. Configure Git:
echo    git config --global user.name "Your Name"
echo    git config --global user.email "your.email@example.com"
echo.
echo 3. Get GitHub token from: https://github.com/settings/tokens
echo.
echo 4. Start the application:
echo    python app.py
echo.
echo 5. Open browser to: http://localhost:5000
echo.
pause
