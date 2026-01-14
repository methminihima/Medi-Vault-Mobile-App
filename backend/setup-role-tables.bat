@echo off
echo ========================================
echo Setting up Role-Specific Tables
echo ========================================
echo.

REM Check if PostgreSQL is accessible
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not in PATH
    echo Please add PostgreSQL bin directory to your PATH
    pause
    exit /b 1
)

echo Connecting to medivault database...
echo.

REM Run the SQL script
psql -U postgres -d medivault -f "%~dp0database\CREATE_ROLE_TABLES.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS: Role-specific tables created!
    echo ========================================
    echo.
    echo The following tables are now ready:
    echo - patients
    echo - doctors
    echo - pharmacists
    echo - lab_technicians
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to create tables
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. medivault database exists
    echo 3. You have the correct permissions
    echo.
)

pause
