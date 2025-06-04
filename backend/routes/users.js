const express = require('express');
const { User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get all faculty members (Admin only)
router.get('/faculty', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const faculty = await User.findAll({
      where: { role: 'faculty' },
      attributes: ['id', 'name', 'facultyId']
    });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty members', error: error.message });
  }
});

// Get users by role (Admin only)
router.get('/role/:role', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: req.params.role },
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users by role', error: error.message });
  }
});

// Get users by department (Admin and Faculty)
router.get('/department/:department', authenticateToken, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        department: req.params.department,
        role: 'student'
      },
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users by department', error: error.message });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Prevent password update through this route

    const [updated] = await User.update(updates, {
      where: { id: req.params.id },
      returning: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get students by year and semester
router.get('/students', authenticateToken, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { year, semester } = req.query;
    const students = await User.findAll({
      where: {
        role: 'student',
        currentYear: year,
        currentSemester: semester
      },
      attributes: ['id', 'name', 'studentId']
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

module.exports = router; 