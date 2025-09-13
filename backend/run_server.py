#!/usr/bin/env python3
"""
Quick server startup script for the trading backtest API.
Run this file to start the Flask backend server.
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages if not already installed."""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def start_server():
    """Start the Flask development server."""
    print("Starting Flask development server...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoints:")
    print("  - GET  /api/health (Health check)")
    print("  - POST /api/backtest (Run backtest)")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        os.system("python app.py")
    except KeyboardInterrupt:
        print("\n Server stopped by user")

if __name__ == "__main__":
    print("🚀 Trading Backtest API Server")
    print("=" * 40)
    
    # Install requirements first
    if install_requirements():
        start_server()
    else:
        print("❌ Failed to install requirements. Please check your Python environment.")