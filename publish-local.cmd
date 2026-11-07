@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1" -Mode local
set "publish_result=%ERRORLEVEL%"
echo.
pause
exit /b %publish_result%
