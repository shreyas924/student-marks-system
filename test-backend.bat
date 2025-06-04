@echo off
echo Testing backend server connectivity...

REM Kill any process using port 5000
echo Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Found process using port 5000: %%a
    echo Attempting to terminate process...
    taskkill /F /PID %%a > nul 2>&1
)

REM Wait a moment for ports to clear
timeout /t 2 > nul

REM Check if port is now available
netstat -aon | findstr :5000
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 5000 is still in use
    echo Please close any application using port 5000
    echo Common applications: Docker Desktop, Other Node.js servers
    pause
) else (
    echo Port 5000 is available
)

REM Test basic server
echo Starting test server...
cd backend

REM Install only required dependencies for test
echo Installing minimal dependencies...
call npm install express cors

REM Start test server
echo Starting minimal test server...
node test-server.js

pause 