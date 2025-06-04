const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import after environment variables are loaded
const sequelize = require('./config/database');

// Import models from index
const { User, Subject, SubjectAssignment, Marks, FacultySubject, CGPA, AcademicStructure } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const subjectsRoutes = require('./routes/subjects');
const marksRoutes = require('./routes/marks');
const userRoutes = require('./routes/users');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: sequelize.config.database ? 'configured' : 'not configured'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Define associations
User.hasMany(SubjectAssignment, { foreignKey: 'facultyId', as: 'teachingAssignments' });
User.hasMany(Marks, { foreignKey: 'studentId', as: 'studentMarks' });
User.hasMany(CGPA, { foreignKey: 'studentId', as: 'cgpaRecords' });

Subject.hasMany(SubjectAssignment, { foreignKey: 'subjectId', as: 'subjectAssignments' });
Subject.hasMany(Marks, { foreignKey: 'subjectId', as: 'subjectMarks' });

SubjectAssignment.belongsTo(User, { foreignKey: 'facultyId', as: 'assignedFaculty' });
SubjectAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'assignedSubject' });
SubjectAssignment.hasMany(Marks, { foreignKey: 'subjectAssignmentId', as: 'assignmentMarks' });

Marks.belongsTo(User, { foreignKey: 'studentId', as: 'marksStudent' });
Marks.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Marks.belongsTo(SubjectAssignment, { foreignKey: 'subjectAssignmentId', as: 'assignment' });

CGPA.belongsTo(User, { foreignKey: 'studentId', as: 'cgpaStudent' });

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    status: 'error',
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models if needed
    const force = process.env.FORCE_SYNC === 'true';

    await sequelize.sync({ force });
    console.log(`Database models synchronized ${force ? '(with force)' : ''}`);
    
    // Get port from environment or use default
    const PORT = process.env.PORT || 5000;
    
    // Create server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log('Available on:');
      console.log(`- http://localhost:${PORT}`);
      console.log(`- http://127.0.0.1:${PORT}`);
      console.log(`- http://${require('os').hostname()}:${PORT}`);
      console.log('='.repeat(50));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use`);
        console.error('Please try:');
        console.error('1. Close any other application using this port');
        console.error('2. Wait a few seconds and try again');
        console.error('3. Use a different port by setting PORT in .env');
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        console.log('HTTP server closed');
        try {
          await sequelize.close();
          console.log('Database connection closed');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database connection:', err);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 