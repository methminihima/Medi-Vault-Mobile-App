@echo off
echo ======================================
echo   MediVault Backend Server Setup
echo ======================================
echo.

echo Checking port 5000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5000 .*LISTENING"') do (
    echo Port 5000 is in use by PID %%P. Stopping it...
    taskkill /PID %%P /F >nul 2>&1
)
echo.

cd backend

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo Starting MediVault Backend Server...
echo Server will run on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
