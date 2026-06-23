@echo off
setlocal

cd /d %~dp0

if "%~1"=="" (
  set "PORT=8080"
) else (
  set "PORT=%~1"
)

echo Starting ngrok tunnel for http://localhost:%PORT%
echo Make sure the backend is already running on the same port.
echo.

ngrok http %PORT%

endlocal
pause
