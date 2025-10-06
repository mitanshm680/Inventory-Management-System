@echo off
title Inventory Management System
color 0A

echo ============================================================
echo         INVENTORY MANAGEMENT SYSTEM - STARTUP
echo ============================================================
echo.

REM Clean old database and cache
echo [STEP 1/5] Cleaning old database and cache...
if exist inventory.db del /F /Q inventory.db
if exist inventory.db-shm del /F /Q inventory.db-shm
if exist inventory.db-wal del /F /Q inventory.db-wal
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
echo    Done!
echo.

REM Start backend
echo [STEP 2/5] Starting backend server...
start "Backend API - Port 8001" cmd /k "python api.py"
timeout /t 5 /nobreak >nul
echo    Backend started on http://127.0.0.1:8001
echo.

REM Start frontend
echo [STEP 3/5] Starting frontend server...
cd frontend
start "Frontend - Port 3000" cmd /k "npm start"
cd ..
echo    Frontend starting on http://localhost:3000
echo.

echo [STEP 4/5] Waiting for servers to initialize...
timeout /t 10 /nobreak >nul
echo    Servers ready!
echo.

echo [STEP 5/5] Opening application...
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo    Browser opened!
echo.

echo ============================================================
echo               APPLICATION IS NOW RUNNING
echo ============================================================
echo.
echo  Backend API:  http://127.0.0.1:8001
echo  Frontend UI:  http://localhost:3000
echo  API Docs:     http://127.0.0.1:8001/docs
echo.
echo  Default Login:
echo    Username: admin
echo    Password: 1234
echo.
echo ============================================================
echo.
echo Press any key to stop all servers and exit...
pause >nul

REM Stop servers
taskkill /FI "WindowTitle eq Backend API*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend*" /T /F >nul 2>&1
echo.
echo All servers stopped. Goodbye!
timeout /t 2 >nul
