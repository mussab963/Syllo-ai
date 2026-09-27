@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==============================
echo        Starting Syllo
echo ==============================
echo.

if not exist node_modules goto :install
if not exist node_modules\framer-motion goto :install
if not exist node_modules\three goto :install
goto :start

:install
echo Installing or updating dependencies...
call npm install
if errorlevel 1 goto :error

:start
echo.
echo Syllo will open at http://localhost:3000
echo Press Ctrl+C to stop it.
echo.
call npm run dev
goto :eof

:error
echo.
echo Syllo could not start. Make sure Node.js is installed, then run npm install manually.
pause
exit /b 1
