@echo off
echo Starting backend server diagnostic...

REM Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo Checking PostgreSQL status...
pg_isready > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Warning: PostgreSQL is not running!
    echo Starting PostgreSQL service...
    net start postgresql
    timeout /t 5
)

REM Create .env file
echo Creating .env file...
(
    echo PORT=5000
    echo DATABASE_URL=postgres://postgres:postgres@localhost:5432/student_marks_system
    echo JWT_SECRET=your_secret_key_here
    echo NODE_ENV=development
    echo FORCE_SYNC=false
) > backend\.env

REM Kill any process using port 5000
echo Checking if port 5000 is in use...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Terminating process: %%a
    taskkill /F /PID %%a > nul 2>&1
)

REM Clean install dependencies
echo Installing backend dependencies...
cd backend
rmdir /s /q node_modules > nul 2>&1
del package-lock.json > nul 2>&1
call npm cache clean --force
call npm install

REM Start server with debug logging
echo Starting backend server...
set DEBUG=express:*
set NODE_ENV=development
echo Server will be available at http://localhost:5000
echo Health check endpoint: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause 