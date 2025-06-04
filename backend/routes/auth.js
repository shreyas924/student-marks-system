const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      studentId,
      facultyId,
      branch,
      currentYear,
      currentSemester,
      academicYear
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Missing required fields',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          role: !role ? 'Role is required' : null
        }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    console.log('Registration attempt:', { email, role });

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('Registration failed: User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    if (!['admin', 'faculty', 'student'].includes(role)) {
      console.log('Registration failed: Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate required fields based on role
    if (role === 'student') {
      const missingFields = [];
      if (!studentId) missingFields.push('studentId');
      if (!department) missingFields.push('department');
      if (!branch) missingFields.push('branch');
      if (!currentYear) missingFields.push('currentYear');
      if (!currentSemester) missingFields.push('currentSemester');
      if (!academicYear) missingFields.push('academicYear');

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: 'Missing required student fields',
          missingFields
        });
      }
    }

    if (role === 'faculty') {
      const missingFields = [];
      if (!facultyId) missingFields.push('facultyId');
      if (!department) missingFields.push('department');

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: 'Missing required faculty fields',
          missingFields
        });
      }
    }

    // Create new user with validation
    const userData = {
      name,
      email,
      password, // Will be hashed by the User model hooks
      role,
      department: role === 'admin' ? null : department,
      studentId: role === 'student' ? studentId : null,
      facultyId: role === 'faculty' ? facultyId : null,
      branch: role === 'student' ? branch : null,
      currentYear: role === 'student' && currentYear ? parseInt(currentYear) : null,
      currentSemester: role === 'student' && currentSemester ? parseInt(currentSemester) : null,
      academicYear: role === 'student' ? academicYear : null
    };

    console.log('Creating new user:', { ...userData, password: '[REDACTED]' });

    const user = await User.create(userData);

    console.log('User created successfully:', { id: user.id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        facultyId: user.facultyId,
        branch: user.branch,
        currentYear: user.currentYear,
        currentSemester: user.currentSemester,
        academicYear: user.academicYear
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Unique constraint error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({ 
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      console.log('Login failed: Missing required fields:', { email: !email, password: !password });
      return res.status(400).json({
        message: 'Missing required fields',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    console.log('Login attempt:', { email });

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('Login successful:', { id: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        facultyId: user.facultyId,
        branch: user.branch,
        currentYear: user.currentYear,
        currentSemester: user.currentSemester,
        academicYear: user.academicYear
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update current user
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow updating certain fields
    const allowedFields = ['name', 'email', 'department'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await user.update(updates);
    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        facultyId: user.facultyId,
        branch: user.branch,
        currentYear: user.currentYear,
        currentSemester: user.currentSemester,
        academicYear: user.academicYear
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    // Get user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router; 