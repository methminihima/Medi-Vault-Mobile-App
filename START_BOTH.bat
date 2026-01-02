@echo off
echo ========================================
echo   Starting MediVault Full Stack
echo ========================================
echo.

REM Start Backend in new window
echo [1/2] Starting Backend Server...
start "MediVault Backend" cmd /k "call start-backend.bat"
timeout /t 3 >nul

REM Start Frontend in new window
echo [2/2] Starting Frontend...
start "MediVault Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: Check Expo terminal for URL
echo.
echo Press any key to close this window...
pause >nul
