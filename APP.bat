@echo off

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Downloading and installing Python...
    curl -o python_installer.exe https://www.python.org/ftp/python/3.13.3/python-3.13.3-amd64.exe
    python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del python_installer.exe
    echo Python installed. Relaunching...
    start "" "%~f0"
    exit
)

cd /d "%~dp0WebApp"

python -m pip install -r requirements.txt

start cmd /k python App.py

timeout /t 2 >nul

start http://127.0.0.1:5000/