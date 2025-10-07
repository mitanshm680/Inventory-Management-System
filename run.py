"""
Simple script to run both backend and frontend servers
"""
import os
import sys
import subprocess
import time
import platform
import webbrowser

def main():
    # Check for command line argument
    populate_data = len(sys.argv) > 1 and sys.argv[1] == "--populate"

    print("=" * 60)
    print("  INVENTORY MANAGEMENT SYSTEM")
    print("  Starting Application...")
    print("=" * 60)
    print()

    # Kill any existing processes on ports 8001 and 3000
    print("[INFO] Checking ports...")
    if platform.system() == "Windows":
        os.system('powershell -Command "Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul')
        time.sleep(1)

    print("[INFO] Starting backend server...")
    # Start backend
    if platform.system() == "Windows":
        backend = subprocess.Popen(
            ["python", "api.py"],
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        backend = subprocess.Popen(
            ["python3", "api.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

    # Wait for backend to start
    print("[INFO] Waiting for backend to initialize...")
    time.sleep(5)

    print("[INFO] Starting frontend server...")
    # Start frontend
    frontend_dir = os.path.join(os.getcwd(), "frontend")

    if platform.system() == "Windows":
        npm_cmd = "npm.cmd"
        frontend = subprocess.Popen(
            [npm_cmd, "start"],
            cwd=frontend_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
            shell=True
        )
    else:
        npm_cmd = "npm"
        frontend = subprocess.Popen(
            [npm_cmd, "start"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

    # Wait for frontend to start
    print("[INFO] Waiting for frontend to initialize...")
    time.sleep(10)

    print()
    print("=" * 60)
    print("  APPLICATION STARTED")
    print("=" * 60)
    print()
    print("Backend:  http://127.0.0.1:8001")
    print("Frontend: http://localhost:3000")
    print("API Docs: http://127.0.0.1:8001/docs")
    print()
    print("Login Credentials:")
    print("  Username: admin")
    print("  Password: 1234")
    print()
    print("=" * 60)
    print()
    print("Opening browser...")

    # Open browser
    time.sleep(3)
    try:
        webbrowser.open('http://localhost:3000')
    except:
        print("[WARN] Could not open browser automatically")

    # Populate data if requested
    if populate_data:
        print()
        print("[INFO] Populating sample data...")
        print()
        try:
            import requests
            # Wait a bit more to ensure server is fully ready
            time.sleep(2)
            # Run populate script
            populate_process = subprocess.run(
                ["python", "populate_data.py"],
                capture_output=False
            )
            if populate_process.returncode == 0:
                print()
                print("[INFO] ✅ Sample data populated successfully!")
                print("[INFO] Refresh your browser to see the data")
            else:
                print()
                print("[WARN] Sample data population failed")
        except Exception as e:
            print(f"[WARN] Could not populate data: {e}")
            print("[INFO] You can manually run: python populate_data.py")

    print()
    print("Press CTRL+C to stop the servers...")
    print()

    try:
        # Keep running
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend.poll() is not None:
                print("[ERROR] Backend server stopped!")
                frontend.terminate()
                sys.exit(1)
            if frontend.poll() is not None:
                print("[ERROR] Frontend server stopped!")
                backend.terminate()
                sys.exit(1)
    except KeyboardInterrupt:
        print()
        print("[INFO] Stopping servers...")
        frontend.terminate()
        backend.terminate()
        print("[INFO] Servers stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()
