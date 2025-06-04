@echo off
echo Starting backend server in debug mode...

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo Creating .env file...
    (
        echo PORT=3001
        echo DATABASE_URL=postgres://postgres:postgres@localhost:5432/student_marks_system
        echo JWT_SECRET=your_secret_key_here
        echo NODE_ENV=development
        echo FORCE_SYNC=false
    ) > backend\.env
    echo Created .env file
)

REM Install backend dependencies
cd backend
call npm install

REM Start backend with debug logging
set DEBUG=express:*
set NODE_ENV=development
echo Starting backend server on port 3001...
call npm run dev

pause 