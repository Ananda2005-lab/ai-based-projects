#!/bin/bash
# AI DevOps - Quick Start Script for macOS/Linux

echo ""
echo "======================================"
echo "   AI DevOps - Quick Start Setup"
echo "======================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

echo "[1/4] Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create virtual environment"
    exit 1
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate

echo "[3/4] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "======================================"
echo "   Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Make sure Git is installed: https://git-scm.com/download/"
echo "2. Configure Git:"
echo "   git config --global user.name 'Your Name'"
echo "   git config --global user.email 'your.email@example.com'"
echo ""
echo "3. Get GitHub token from: https://github.com/settings/tokens"
echo ""
echo "4. Start the application:"
echo "   python app.py"
echo ""
echo "5. Open browser to: http://localhost:5000"
echo ""
