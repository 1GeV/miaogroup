@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
set "publish_result=%ERRORLEVEL%"
echo.
pause
exit /b %publish_result%
