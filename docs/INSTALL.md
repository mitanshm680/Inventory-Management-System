# Installation Guide for Inventory Management System

Before running the application, you need to install the following dependencies:

## Required Dependencies

### 1. Python (3.8+ recommended)

Download and install Python from the official website:
- [Python Downloads](https://www.python.org/downloads/)

During installation, make sure to check the option to **Add Python to PATH**.

### 2. Node.js and npm

Download and install Node.js from the official website:
- [Node.js Downloads](https://nodejs.org/)

The Node.js installer will also install npm (Node Package Manager).

## Verifying Your Installation

After installation, you can verify that everything is installed correctly by opening a command prompt or terminal and running:

```
python --version
pip --version
node --version
npm --version
```

Each command should display the version number if properly installed.

## Running the Application

Once you have installed all dependencies, you can run the application using:

```
python run.py
```

This will:
1. Create a Python virtual environment
2. Install all required Python packages
3. Start the backend server
4. Install frontend dependencies (first run only)
5. Start the React development server
6. Open your browser to the application

## Troubleshooting

### Command Not Found

If you get a "command not found" error, it likely means the program is not installed or not in your PATH.

- For Python/pip: Make sure you checked "Add Python to PATH" during installation
- For Node/npm: The installer should have added these to your PATH automatically

### Permission Issues

If you encounter permission errors:

- **Windows**: Run Command Prompt as Administrator
- **Mac/Linux**: Use `sudo` before commands that require elevated permissions

### Package Installation Issues

If you have issues with package installation:

1. Try upgrading pip: `python -m pip install --upgrade pip`
2. Make sure you have internet access
3. Check if your firewall or antivirus is blocking the installation

### Port Already in Use

If the application fails to start because the port is already in use:
1. Find and close any applications using ports 3000 (frontend) or 8000 (backend)
2. Alternatively, modify the ports in the code if needed 