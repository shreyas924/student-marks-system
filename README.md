# Student Marks Management System

A comprehensive system for managing student marks with role-based access control for administrators, faculty, and students.

## Features

### Admin Dashboard
- User Management (Create, Update, Delete users)
- Department and Class Management
- View all marks and generate reports
- System-wide access and control

### Faculty Dashboard
- Enter and update marks for assigned students
- View student performance in their subjects
- Track assignments, CAs, midterm, and end semester marks
- Generate class-wise reports

### Student Dashboard
- View personal marks and performance
- Track progress across different subjects
- View detailed breakup of marks
- Access assessment history

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Frontend: React.js (to be implemented)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   cd student-marks-system
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/student-marks-system
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. Start MongoDB server

5. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Marks Management
- POST /api/marks - Create marks entry (Faculty/Admin)
- GET /api/marks/all - Get all marks (Admin)
- GET /api/marks/student/:studentId - Get student marks
- GET /api/marks/faculty - Get faculty's entered marks
- PUT /api/marks/:id - Update marks entry
- DELETE /api/marks/:id - Delete marks entry (Admin)

### User Management
- GET /api/users - Get all users (Admin)
- GET /api/users/role/:role - Get users by role
- GET /api/users/department/:department - Get users by department
- PUT /api/users/:id - Update user (Admin)
- DELETE /api/users/:id - Delete user (Admin)

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing
- Protected routes
- Input validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 