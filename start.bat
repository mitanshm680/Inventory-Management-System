@echo off
echo ========================================
echo Inventory Management System
echo ========================================
echo.

REM Start backend
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "python api.py"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo [2/2] Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ========================================
echo Servers are starting...
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
echo ========================================
pause >nul

REM Kill the servers
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1
echo Servers stopped.
