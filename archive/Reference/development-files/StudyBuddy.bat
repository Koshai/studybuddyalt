@echo off
title StudyBuddy - Starting...

REM Change to the application directory
cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if server is already running
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo StudyBuddy server is already running!
    goto OPEN_BROWSER
)

REM Try different ports if 3001 is busy
set PORT=3001
:CHECK_PORT
netstat -ano | findstr :%PORT% >nul 2>&1
if %errorlevel% equ 0 (
    set /a PORT+=1
    if %PORT% lss 3010 goto CHECK_PORT
    echo No available ports found between 3001-3010
    pause
    exit /b 1
)

echo Starting StudyBuddy server on port %PORT%...
echo.
echo ==================================================
echo   StudyBuddy - AI Study Assistant
echo   Server starting on http://localhost:%PORT%
echo   
echo   Your browser will open automatically...
echo   Close this window to stop the server
echo ==================================================
echo.

REM Start the server with the available port
set PORT=%PORT%
start "" npm start

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open browser
start "" "http://localhost:%PORT%"

REM Keep the window open
echo Server is running. Close this window to stop StudyBuddy.
echo Press Ctrl+C to stop the server safely.
pause >nul