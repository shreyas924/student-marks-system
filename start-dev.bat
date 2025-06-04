@echo off
echo Starting development servers...

REM Check if PostgreSQL is running
echo Checking PostgreSQL status...
pg_isready >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not running!
    echo Please start PostgreSQL service and try again.
    pause
    exit /b 1
)
echo PostgreSQL is running.

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo Creating .env file...
    (
        echo PORT=5000
        echo DATABASE_URL=postgres://postgres:postgres@localhost:5432/student_marks_system
        echo JWT_SECRET=your_secret_key_here
        echo NODE_ENV=development
        echo FORCE_SYNC=false
    ) > backend\.env
    echo Created .env file
)

REM Install backend dependencies and start server
echo Starting backend server...
start cmd /k "cd backend && npm install && echo. && echo Starting backend... && npm run dev"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 10 /nobreak

REM Check if backend is running
curl -s http://localhost:5000/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Backend health check failed!
    echo Please check the backend console for errors.
    echo Press any key to continue with frontend startup anyway...
    pause >nul
) else (
    echo Backend health check passed!
)

REM Install frontend dependencies and start server
echo Starting frontend server...
start cmd /k "cd frontend && npm install && npm start"

echo.
echo =================================================
echo Servers are starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
echo.
echo If you encounter any issues:
echo 1. Check if PostgreSQL is running
echo 2. Check backend console for database errors
echo 3. Ensure ports 5000 and 3000 are available
echo =================================================
echo. 