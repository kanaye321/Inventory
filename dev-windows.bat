@echo off
title SRPH-MIS - Development Mode
echo.
echo ================================================
echo SRPH-MIS User Management System
echo Development Mode - Windows Compatible
echo ================================================
echo.

REM Set development environment
set NODE_ENV=development
set PORT=5000
set DEBUG=express:*

echo ✓ Environment: Development
echo ✓ Port: 5000
echo ✓ Debug: Enabled
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo ✓ Dependencies installed
    echo.
)

echo Starting development server...
echo.
echo Features enabled:
echo - User Management System
echo - Permission Controls
echo - In-Memory Storage
echo - Windows Compatibility
echo.
echo Access: http://localhost:5000
echo Admin: admin / admin123
echo.

call npm run dev