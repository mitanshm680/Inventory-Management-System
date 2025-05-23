import os
import sys
import logging
import subprocess
import argparse
import platform
import time
import webbrowser
from pathlib import Path

# Environment variables with defaults
API_PORT = int(os.environ.get("API_PORT", 8001))
FRONTEND_PORT = int(os.environ.get("FRONTEND_PORT", 3000))

def check_venv():
    """Check if running in a virtual environment."""
    # Check if already in venv
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    
    # On Windows, also check if the virtual environment exists but just isn't activated
    if not in_venv and platform.system() == "Windows" and os.path.exists('.venv'):
        # If we're not in a venv but .venv exists, attempt to run with the venv python
        venv_python = os.path.join('.venv', 'Scripts', 'python.exe')
        if os.path.exists(venv_python):
            # Re-run this script using the venv python
            print(f"Detected virtual environment. Restarting with venv Python...")
            subprocess.Popen([venv_python] + sys.argv)
            sys.exit(0)
    
    return in_venv

def create_venv():
    """Create a virtual environment if not exists."""
    if os.path.exists('.venv'):
        print("Virtual environment already exists.")
        return
    
    print("Creating virtual environment...")
    try:
        subprocess.check_call([sys.executable, '-m', 'venv', '.venv'])
        print("Virtual environment created successfully.")
    except subprocess.CalledProcessError:
        print("Failed to create virtual environment.")
        sys.exit(1)

def activate_venv():
    """Activate the virtual environment."""
    if check_venv():
        print("Already in a virtual environment.")
        return
    
    venv_path = Path('.venv')
    if not venv_path.exists():
        create_venv()
    
    # Determine the path to the activation script
    if platform.system() == "Windows":
        activate_script = venv_path / 'Scripts' / 'activate.bat'
        python_exe = venv_path / 'Scripts' / 'python.exe'
        
        if python_exe.exists():
            print(f"Restarting script with virtual environment Python...")
            # Rather than trying to activate, just use the venv python directly
            subprocess.Popen([str(python_exe)] + sys.argv)
            sys.exit(0)
        else:
            command = f"{activate_script}"
    else:  # Linux/Mac
        activate_script = venv_path / 'bin' / 'activate'
        command = f"source {activate_script}"
    
    print(f"To activate the virtual environment, run: {command}")
    print("Then run this script again.")
    sys.exit(0)

def install_backend_dependencies():
    """Install backend dependencies."""
    print("Installing backend dependencies...")
    pip_cmd = [sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt']
    try:
        subprocess.check_call(pip_cmd)
        print("Backend dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to install backend dependencies. Error: {e}")
        sys.exit(1)

def install_frontend_dependencies():
    """Install frontend dependencies if not yet installed."""
    if not os.path.exists(os.path.join('frontend', 'node_modules')):
        print("Installing frontend dependencies (this may take a while)...")
        try:
            npm_cmd = 'npm'
            if platform.system() == "Windows" and os.path.exists('C:\\Program Files\\nodejs\\npm.cmd'):
                npm_cmd = 'C:\\Program Files\\nodejs\\npm.cmd'
                
            subprocess.check_call([npm_cmd, 'install'], cwd='frontend')
            print("Frontend dependencies installed successfully.")
        except subprocess.CalledProcessError:
            print("Failed to install frontend dependencies.")
            sys.exit(1)
    else:
        print("Frontend dependencies already installed.")

def start_backend():
    """Start the backend server."""
    global API_PORT
    
    max_retry = 5
    retry_count = 0
    
    while retry_count < max_retry:
        print(f"Starting backend server on port {API_PORT}...")
        backend_cmd = [sys.executable, 'api.py']
        # Pass the port as an environment variable
        env = os.environ.copy()
        env["API_PORT"] = str(API_PORT)
        
        try:
            backend_process = subprocess.Popen(backend_cmd, env=env)
            # Give it a moment to start and check if it crashes immediately
            time.sleep(2)
            
            # Check if the process is still running
            if backend_process.poll() is None:
                print(f"Backend server successfully started on port {API_PORT}.")
                return backend_process
            else:
                # Process exited with an error
                retry_count += 1
                API_PORT += 1
                print(f"Port {API_PORT-1} is in use. Trying port {API_PORT}...")
                
        except Exception as e:
            print(f"Error starting backend: {e}")
            retry_count += 1
            API_PORT += 1
            print(f"Trying port {API_PORT}...")
    
    print("Failed to start backend server after multiple attempts.")
    sys.exit(1)

def start_frontend():
    """Start the frontend development server."""
    print(f"Starting frontend development server on port {FRONTEND_PORT}...")
    try:
        # For Windows, we'll directly use 'npm' since we've verified it's in the PATH
        npm_cmd = 'npm'
        
        # Pass the port as an environment variable for React
        env = os.environ.copy()
        env["PORT"] = str(FRONTEND_PORT)
        # Pass API_PORT to React app
        env["REACT_APP_API_PORT"] = str(API_PORT)
        # Prevent React from opening its own browser tab
        env["BROWSER"] = "none"
        
        print(f"Using npm command: {npm_cmd}")
        # Use shell=True on Windows to make sure npm can be found
        if platform.system() == "Windows":
            frontend_process = subprocess.Popen(f"{npm_cmd} start", cwd='frontend', env=env, shell=True)
        else:
            frontend_process = subprocess.Popen([npm_cmd, 'start'], cwd='frontend', env=env)
        print(f"Frontend development server started on port {FRONTEND_PORT}.")
        return frontend_process
    except subprocess.CalledProcessError as e:
        print(f"Failed to start frontend server. Error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("ERROR: npm not found. Please make sure Node.js and npm are installed.")
        print("Download from: https://nodejs.org/")
        sys.exit(1)

def main():
    """Main entry point for the application launcher."""
    global API_PORT
    
    parser = argparse.ArgumentParser(description='Run the Inventory Management System')
    parser.add_argument('--backend-only', action='store_true', help='Run only the backend server')
    parser.add_argument('--frontend-only', action='store_true', help='Run only the frontend server')
    parser.add_argument('--cli', action='store_true', help='Run the CLI version')
    parser.add_argument('--port', type=int, help=f'Port for the API (default: {API_PORT})')
    parser.add_argument('--no-browser', action='store_true', help='Do not open browser automatically')
    args = parser.parse_args()
    
    # Override port if specified in command line
    if args.port:
        API_PORT = args.port
        os.environ["API_PORT"] = str(API_PORT)
    
    # Check and activate virtual environment if needed
    if not check_venv():
        activate_venv()
    
    # Install dependencies
    install_backend_dependencies()
    
    if args.cli:
        # Run the CLI version
        subprocess.call([sys.executable, 'main.py'])
    else:
        # Start the application components
        backend_process = None
        frontend_process = None
        
        try:
            if not args.frontend_only:
                backend_process = start_backend()
                # After backend starts, update the environment variable
                os.environ["API_PORT"] = str(API_PORT)
            
            if not args.backend_only:
                install_frontend_dependencies()
                frontend_process = start_frontend()
                
                # Open browser after a short delay
                if not args.no_browser:
                    print(f"Opening browser in 3 seconds at http://localhost:{FRONTEND_PORT}...")
                    time.sleep(3)
                    # Only open the browser once
                    webbrowser.open(f'http://localhost:{FRONTEND_PORT}')
            
            # Keep the script running until Ctrl+C
            print("\nPress Ctrl+C to stop the servers\n")
            
            # Wait for processes to complete
            while True:
                if backend_process and backend_process.poll() is not None:
                    print("Backend server stopped.")
                    break
                    
                if frontend_process and frontend_process.poll() is not None:
                    print("Frontend server stopped.")
                    break
                    
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\nShutting down servers...")
        finally:
            # Clean up processes
            if backend_process:
                backend_process.terminate()
                print("Backend server terminated.")
                
            if frontend_process:
                frontend_process.terminate()
                print("Frontend server terminated.")

if __name__ == "__main__":
    main() 