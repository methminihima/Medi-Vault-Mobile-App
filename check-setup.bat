@echo off
echo.
echo ========================================
echo   MediVault Backend Connection Check
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js is NOT installed
    echo     Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo [✓] Node.js is installed
)

REM Check if PostgreSQL is accessible
echo.
echo [2/5] Checking PostgreSQL...
echo     Please ensure PostgreSQL is running in pgAdmin
echo     Press any key when ready...
pause >nul

REM Check if backend folder exists
echo.
echo [3/5] Checking backend folder...
if not exist "backend\" (
    echo [X] Backend folder not found!
    pause
    exit /b 1
) else (
    echo [✓] Backend folder exists
)

REM Check if .env file exists
echo.
echo [4/5] Checking configuration...
if not exist "backend\.env" (
    echo [!] .env file not found
    echo     Creating from template...
    copy "backend\.env.example" "backend\.env" >nul 2>&1
    echo [!] Please update backend\.env with your PostgreSQL password
    notepad backend\.env
) else (
    echo [✓] Configuration file exists
)

REM Check if node_modules exists
echo.
echo [5/5] Checking dependencies...
if not exist "backend\node_modules\" (
    echo [!] Dependencies not installed
    echo     Installing now...
    cd backend
    call npm install
    cd ..
    echo [✓] Dependencies installed
) else (
    echo [✓] Dependencies already installed
)

echo.
echo ========================================
echo   Setup Check Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Create database 'medivault_db' in pgAdmin
echo 3. Run backend\database\schema.sql in pgAdmin
echo 4. Update backend\.env with your password
echo 5. Run: start-backend.bat
echo.

choice /C YN /M "Would you like to start the backend now"
if errorlevel 2 goto end
if errorlevel 1 goto start

:start
echo.
echo Starting backend server...
cd backend
call npm run dev
goto end

:end
echo.
pause
