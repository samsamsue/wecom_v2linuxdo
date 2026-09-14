@echo off
setlocal
cd /d "%~dp0"
set "PY=pythonw"
where pythonw >nul 2>nul || set "PY=python"
start "" %PY% "tools\wecom_borderless.py"
exit
