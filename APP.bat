@echo off

cd /d "%~dp0WebApp"

python -m pip install -r requirements.txt

start cmd /k python App.py

timeout /t 2 >nul

start http://127.0.0.1:5000/