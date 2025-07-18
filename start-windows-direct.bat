@echo off
echo ============================================
echo     SRPH-MIS Windows Development Server
echo ============================================
echo.

REM Check if tsx is available
where tsx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing tsx globally...
    npm install -g tsx
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install tsx
        echo Please install tsx manually: npm install -g tsx
        pause
        exit /b 1
    )
)

echo Setting environment variables...
set NODE_ENV=production
set PORT=5000
set HOST=0.0.0.0

echo Environment configured:
echo   NODE_ENV = %NODE_ENV%
echo   PORT = %PORT%
echo   HOST = %HOST%
echo.

echo Starting SRPH-MIS server...
echo Server will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

tsx server/index.ts

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error: Server failed to start
    echo.
    echo Troubleshooting:
    echo 1. Make sure dependencies are installed: npm install
    echo 2. Check if port 3000 is available
    echo 3. Verify database connection in .env file
    echo.
    pause
)