@echo off
echo ============================================
echo   INVENTORY MANAGEMENT SYSTEM
echo   Starting Application...
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 14 or higher
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies not found
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo ============================================
echo   STARTING BACKEND SERVER (Port 8001)
echo ============================================
echo.

REM Start backend in a new window
start "Inventory Backend" cmd /k "python api.py"

echo [OK] Backend starting...
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   STARTING FRONTEND SERVER (Port 3000)
echo ============================================
echo.

REM Start frontend in a new window
cd frontend
start "Inventory Frontend" cmd /k "npm start"
cd ..

echo.
echo ============================================
echo   APPLICATION STARTED
echo ============================================
echo.
echo Backend:  http://127.0.0.1:8001
echo Frontend: http://localhost:3000
echo API Docs: http://127.0.0.1:8001/docs
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: 1234
echo.
echo Press any key to close this window...
echo (The application will continue running)
pause >nul
