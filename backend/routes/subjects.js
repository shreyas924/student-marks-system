const express = require('express');
const { authenticateToken, isAdmin, authorize } = require('../middleware/auth');
const { Subject, User, SubjectAssignment } = require('../models');
const { sequelize } = require('../config/database');

const router = express.Router();

// Get all subject assignments
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const assignments = await SubjectAssignment.findAll({
      include: [
        {
          model: User,
          as: 'assignedFaculty',
          attributes: ['id', 'name', 'facultyId']
        },
        {
          model: Subject,
          as: 'assignedSubject',
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch subject assignments', error: error.message });
  }
});

// Get assignments for a specific faculty
router.get('/faculty/:facultyId', authenticateToken, async (req, res) => {
  try {
    const assignments = await SubjectAssignment.findAll({
      where: {
        facultyId: req.params.facultyId
      },
      include: [
        {
          model: Subject,
          as: 'assignedSubject',
          attributes: ['id', 'name', 'code', 'year', 'semester', 'branch']
        }
      ]
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching faculty subjects:', error);
    res.status(500).json({ message: 'Failed to fetch faculty subjects' });
  }
});

// Get subjects by year, semester, and branch
router.get('/filter', authenticateToken, async (req, res) => {
  try {
    const { year, semester, branch } = req.query;
    const subjects = await Subject.findAll({
      where: {
        ...(year && { year: parseInt(year) }),
        ...(semester && { semester: parseInt(semester) }),
        ...(branch && { branch })
      },
      include: [{
        model: User,
        as: 'faculty',
        attributes: ['id', 'name', 'email', 'facultyId']
      }]
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching filtered subjects:', error);
    res.status(500).json({ 
      message: 'Error fetching filtered subjects', 
      error: error.message 
    });
  }
});

// Get all subjects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: User,
        as: 'faculty',
        attributes: ['id', 'name', 'facultyId']
      }]
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Get subject by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'faculty',
        attributes: ['id', 'name', 'facultyId']
      }]
    });
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Error fetching subject' });
  }
});

// Create a new subject (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(400).json({ 
      message: 'Error creating subject', 
      error: error.message 
    });
  }
});

// Create a new subject assignment
router.post('/assignments', authenticateToken, authorize('admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { facultyId, subjectId } = req.body;

    // Validate faculty exists
    const faculty = await User.findOne({
      where: { id: facultyId, role: 'faculty' },
      transaction
    });

    if (!faculty) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Validate subject exists
    const subject = await Subject.findByPk(subjectId, { transaction });
    if (!subject) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await SubjectAssignment.findOne({
      where: {
        facultyId,
        subjectId,
        isActive: true
      },
      transaction
    });

    if (existingAssignment) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Subject is already assigned to this faculty' });
    }

    const assignment = await SubjectAssignment.create({
      facultyId,
      subjectId,
      isActive: true
    }, { transaction });

    await transaction.commit();

    // Fetch complete assignment details
    const completeAssignment = await SubjectAssignment.findOne({
      where: { id: assignment.id },
      include: [
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'facultyId']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.status(201).json(completeAssignment);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating subject assignment:', error);
    res.status(500).json({ message: 'Failed to create subject assignment', error: error.message });
  }
});

// Toggle assignment status
router.patch('/assignments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const assignment = await SubjectAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.isActive = isActive;
    await assignment.save();

    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Failed to update assignment status', error: error.message });
  }
});

// Delete a subject assignment
router.delete('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByPk(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await assignment.destroy();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// Update a subject (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    await subject.update(req.body);
    res.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(400).json({ 
      message: 'Error updating subject', 
      error: error.message 
    });
  }
});

// Delete a subject (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    await subject.destroy();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ 
      message: 'Error deleting subject', 
      error: error.message 
    });
  }
});

module.exports = router; 