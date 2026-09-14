@echo off
setlocal
cd /d "%~dp0"

:: 查找系统中的 Chrome 或 Edge 浏览器
set "BROWSER="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) do (
  if not defined BROWSER if exist "%%~P" set "BROWSER=%%~P"
)

if not defined BROWSER (
  echo [错误] 未检测到 Chrome 或 Edge 浏览器，请确认已安装。
  pause
  exit /b 1
)

:: 启动无边框助手（快捷键 F8 切换，Alt+左键拖动窗口）
set "PY=pythonw"
where pythonw >nul 2>nul || set "PY=python"
start "" %PY% "tools\wecom_borderless.py"

:: 启动独立 App 模式窗口（消除浏览器标签页、地址栏与书签栏）
start "" "%BROWSER%" --app=https://linux.do
exit
