import os
import sys
import logging
import subprocess
import argparse
import platform
import time
import webbrowser
import socket
import signal
import psutil
from pathlib import Path
from typing import Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/server.log')
    ]
)

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
        logging.info("Virtual environment already exists.")
        return
    
    logging.info("Creating virtual environment...")
    try:
        subprocess.check_call([sys.executable, '-m', 'venv', '.venv'])
        logging.info("Virtual environment created successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to create virtual environment: {e}")
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

def get_venv_python() -> str:
    """Get the path to the Python executable in the virtual environment."""
    if platform.system() == "Windows":
        python_path = os.path.join('.venv', 'Scripts', 'python.exe')
    else:
        python_path = os.path.join('.venv', 'bin', 'python')
    
    if not os.path.exists(python_path):
        raise RuntimeError("Virtual environment Python not found. Please run setup first.")
    
    return python_path

def install_backend_dependencies():
    """Install backend dependencies with proper error handling."""
    logging.info("Installing backend dependencies...")
    venv_pip = get_venv_python()
    pip_cmd = [venv_pip, '-m', 'pip', 'install', '-r', 'requirements.txt']
    
    try:
        subprocess.check_call(pip_cmd)
        logging.info("Backend dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to install backend dependencies: {e}")
        sys.exit(1)

def install_frontend_dependencies():
    """Install frontend dependencies with proper error handling."""
    if not os.path.exists(os.path.join('frontend', 'node_modules')):
        logging.info("Installing frontend dependencies (this may take a while)...")
        try:
            npm_cmd = 'npm.cmd' if platform.system() == "Windows" else 'npm'
            subprocess.check_call([npm_cmd, 'install'], cwd='frontend')
            logging.info("Frontend dependencies installed successfully.")
        except subprocess.CalledProcessError as e:
            logging.error(f"Failed to install frontend dependencies: {e}")
            sys.exit(1)
        except FileNotFoundError:
            logging.error("npm not found. Please install Node.js and npm first.")
            logging.error("Download from: https://nodejs.org/")
            sys.exit(1)
    else:
        logging.info("Frontend dependencies already installed.")

def is_port_available(port: int) -> bool:
    """Check if a port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return True
        except socket.error:
            return False

def find_available_port(start_port: int, max_attempts: int = 10) -> int:
    """Find an available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    raise RuntimeError(f"No available ports found in range {start_port}-{start_port + max_attempts - 1}")

def kill_process_on_port(port: int):
    """Kill any process running on the specified port."""
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.connections():
                if conn.laddr.port == port:
                    logging.warning(f"Killing process {proc.pid} ({proc.name()}) on port {port}")
                    if platform.system() == "Windows":
                        subprocess.call(['taskkill', '/F', '/PID', str(proc.pid)])
                    else:
                        os.kill(proc.pid, signal.SIGTERM)
                    time.sleep(1)  # Give the process time to die
                    return
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

def start_backend(port: int = None) -> Tuple[subprocess.Popen, int]:
    """Start the backend server with proper port management."""
    if port is None:
        port = find_available_port(API_PORT)
    
    if not is_port_available(port):
        kill_process_on_port(port)
        time.sleep(1)  # Wait for port to be freed
        if not is_port_available(port):
            port = find_available_port(API_PORT)
    
    logging.info(f"Starting backend server on port {port}...")
    venv_python = get_venv_python()
    backend_cmd = [venv_python, 'api.py']
    env = os.environ.copy()
    env["API_PORT"] = str(port)
    
    try:
        backend_process = subprocess.Popen(backend_cmd, env=env)
        # Wait for server to start
        max_retries = 30
        for i in range(max_retries):
            if not is_port_available(port):  # Port is in use = server started
                logging.info(f"Backend server successfully started on port {port}")
                return backend_process, port
            time.sleep(1)
            if i == max_retries - 1:
                raise RuntimeError("Backend server failed to start")
            if backend_process.poll() is not None:
                raise RuntimeError("Backend process terminated unexpectedly")
    except Exception as e:
        logging.error(f"Failed to start backend server: {e}")
        sys.exit(1)

def start_frontend(api_port: int, frontend_port: Optional[int] = None) -> Tuple[subprocess.Popen, int]:
    """Start the frontend development server with proper port management."""
    if frontend_port is None:
        frontend_port = find_available_port(FRONTEND_PORT)
    
    if not is_port_available(frontend_port):
        kill_process_on_port(frontend_port)
        time.sleep(1)
        if not is_port_available(frontend_port):
            frontend_port = find_available_port(FRONTEND_PORT)
    
    logging.info(f"Starting frontend development server on port {frontend_port}...")
    npm_cmd = 'npm.cmd' if platform.system() == "Windows" else 'npm'
    
    # Pass the ports as environment variables for React
    env = os.environ.copy()
    env["PORT"] = str(frontend_port)
    env["REACT_APP_API_PORT"] = str(api_port)
    env["BROWSER"] = "none"  # Prevent automatic browser opening
    
    try:
        if platform.system() == "Windows":
            frontend_process = subprocess.Popen(
                f"{npm_cmd} start",
                cwd='frontend',
                env=env,
                shell=True
            )
        else:
            frontend_process = subprocess.Popen(
                [npm_cmd, 'start'],
                cwd='frontend',
                env=env
            )
        
        # Wait for server to start
        max_retries = 30
        for i in range(max_retries):
            if not is_port_available(frontend_port):
                logging.info(f"Frontend server successfully started on port {frontend_port}")
                return frontend_process, frontend_port
            time.sleep(1)
            if i == max_retries - 1:
                raise RuntimeError("Frontend server failed to start")
            if frontend_process.poll() is not None:
                raise RuntimeError("Frontend process terminated unexpectedly")
    except Exception as e:
        logging.error(f"Failed to start frontend server: {e}")
        sys.exit(1)

def main():
    """Main entry point with improved error handling."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run the Inventory Management System')
    parser.add_argument('--backend-only', action='store_true', help='Run only the backend')
    parser.add_argument('--frontend-only', action='store_true', help='Run only the frontend')
    parser.add_argument('--port', type=int, help='Specify custom port for the API')
    parser.add_argument('--frontend-port', type=int, help='Specify custom port for the frontend')
    args = parser.parse_args()
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    try:
        if not args.frontend_only:
            create_venv()
            install_backend_dependencies()
        
        if not args.backend_only:
            install_frontend_dependencies()
        
        backend_process = None
        frontend_process = None
        
        try:
            if not args.frontend_only:
                backend_process, api_port = start_backend(args.port)
            
            if not args.backend_only:
                frontend_process, frontend_port = start_frontend(
                    api_port if backend_process else API_PORT,
                    args.frontend_port
                )
            
            # Keep the script running
            while True:
                time.sleep(1)
                # Check if processes are still running
                if backend_process and backend_process.poll() is not None:
                    raise RuntimeError("Backend process terminated unexpectedly")
                if frontend_process and frontend_process.poll() is not None:
                    raise RuntimeError("Frontend process terminated unexpectedly")
        
        except KeyboardInterrupt:
            logging.info("Shutting down servers...")
        finally:
            # Cleanup
            if backend_process:
                backend_process.terminate()
                backend_process.wait(timeout=5)
            if frontend_process:
                frontend_process.terminate()
                frontend_process.wait(timeout=5)
    
    except Exception as e:
        logging.error(f"Error running servers: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 