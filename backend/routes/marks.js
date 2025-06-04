const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, isAdmin } = require('../middleware/auth');
const { Marks, Subject, User, SubjectAssignment } = require('../models');

// Create marks entry (Faculty and Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is faculty or admin
    if (!['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create marks' });
    }

    const marks = await Marks.create({
      ...req.body
    });
    res.status(201).json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error creating marks entry', error: error.message });
  }
});

// Get all marks (Admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const marks = await Marks.findAll({
      include: [{
        model: User,
        as: 'marksStudent',
        attributes: ['name', 'studentId']
      }, {
        model: SubjectAssignment,
        as: 'assignment'
      }]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks', error: error.message });
  }
});

// Get student's marks (Student can view their own marks)
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Check if user is authorized to view these marks
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view these marks' });
    }

    const marks = await Marks.findAll({
      where: { studentId },
      include: [{
        model: SubjectAssignment,
        as: 'subject'
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student marks', error: error.message });
  }
});

// Get marks by faculty (Faculty can view marks they've entered)
router.get('/faculty', authenticateToken, async (req, res) => {
  try {
    // Check if user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' });
    }

    const marks = await Marks.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'assignment',
        where: { facultyId: req.user.id }
      }, {
        model: User,
        as: 'marksStudent',
        attributes: ['name', 'studentId']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty marks', error: error.message });
  }
});

// Update marks (Faculty who created the entry and Admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is faculty or admin
    if (!['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update marks' });
    }

    const mark = await Marks.findOne({
      where: { id: req.params.id },
      include: [{
        model: SubjectAssignment,
        as: 'subject'
      }]
    });
    
    if (!mark) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }

    // Check if faculty is authorized to update these marks
    if (req.user.role === 'faculty' && mark.subject.facultyId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update these marks' });
    }

    await mark.update(req.body);
    res.json(mark);
  } catch (error) {
    res.status(500).json({ message: 'Error updating marks', error: error.message });
  }
});

// Delete marks (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const mark = await Marks.findByPk(req.params.id);
    if (!mark) {
      return res.status(404).json({ message: 'Marks entry not found' });
    }
    await mark.destroy();
    res.json({ message: 'Marks entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting marks', error: error.message });
  }
});

// Get marks by subject and class (Faculty and Admin)
router.get('/subject/:subject/class/:class', authenticateToken, async (req, res) => {
  try {
    // Check if user is faculty or admin
    if (!['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view marks' });
    }

    const marks = await Marks.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'assignment',
        where: { id: req.params.subject }
      }, {
        model: User,
        as: 'marksStudent',
        where: { currentYear: req.params.class },
        attributes: ['name', 'studentId', 'currentYear']
      }]
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks by subject and class', error: error.message });
  }
});

// Get marks for a subject
router.get('/:subjectId', authenticateToken, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Verify the subject exists and the faculty has access to it
    const subject = await Subject.findOne({
      where: {
        id: subjectId,
        ...(req.user.role === 'faculty' ? { facultyId: req.user.id } : {})
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or access denied' });
    }

    const marks = await Marks.findAll({
      where: { subjectAssignmentId: subjectId },
      include: [{
        model: User,
        as: 'marksStudent',
        attributes: ['id', 'name', 'studentId']
      }]
    });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Error fetching marks' });
  }
});

// Update or create marks for multiple students
router.post('/:subjectId', authenticateToken, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Invalid entries format' });
    }

    // Verify the subject exists and the faculty has access to it
    const subject = await Subject.findOne({
      where: {
        id: subjectId,
        facultyId: req.user.id
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or access denied' });
    }

    // Process each entry
    const results = await Promise.all(entries.map(async (entry) => {
      const { studentId, marks, type } = entry;

      // Validate student exists
      const student = await User.findOne({
        where: { id: studentId, role: 'student' }
      });

      if (!student) {
        return {
          studentId,
          success: false,
          message: 'Student not found'
        };
      }

      try {
        // Find or create marks entry
        const [marksEntry, created] = await Marks.findOrCreate({
          where: {
            studentId,
            subjectAssignmentId: subjectId,
            type
          },
          defaults: {
            marks,
            enteredBy: req.user.id
          }
        });

        if (!created) {
          // Update existing entry
          await marksEntry.update({
            marks,
            enteredBy: req.user.id
          });
        }

        return {
          studentId,
          success: true,
          message: created ? 'Marks created' : 'Marks updated'
        };
      } catch (error) {
        return {
          studentId,
          success: false,
          message: error.message
        };
      }
    }));

    res.json({
      message: 'Marks processing completed',
      results
    });
  } catch (error) {
    console.error('Error processing marks:', error);
    res.status(500).json({ message: 'Error processing marks' });
  }
});

// Add marks in bulk for multiple students
router.post('/bulk', authenticateToken, async (req, res) => {
  const { subjectId, entries } = req.body;

  try {
    // Verify if the subject exists and the faculty is assigned to it
    const subject = await SubjectAssignment.findOne({
      where: {
        id: subjectId,
        facultyId: req.user.id
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or not assigned to you' });
    }

    // Create marks entries
    const markEntries = entries.map(entry => ({
      subjectAssignmentId: subjectId,
      studentId: entry.studentId,
      assessmentType: entry.assessmentType,
      marks: entry.marks
    }));

    await Marks.bulkCreate(markEntries);
    res.status(201).json({ message: 'Marks added successfully' });
  } catch (error) {
    console.error('Error adding marks:', error);
    res.status(500).json({ message: 'Failed to add marks', error: error.message });
  }
});

// Get marks for a subject and assessment type
router.get('/:subjectId/:assessmentType', authenticateToken, async (req, res) => {
  try {
    const { subjectId, assessmentType } = req.params;

    // Verify if the user has access to this subject
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Only allow faculty assigned to the subject or admin to access marks
    if (req.user.role !== 'admin' && subject.facultyId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access these marks' });
    }

    const marks = await Marks.findAll({
      where: {
        subjectId,
        assessmentType
      },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'studentId']
      }]
    });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ 
      message: 'Error fetching marks', 
      error: error.message 
    });
  }
});

// Save marks in bulk
router.post('/bulk', authenticateToken, authorize('faculty', 'admin'), async (req, res) => {
  const transaction = await Marks.sequelize.transaction();

  try {
    const { marks } = req.body;

    // Verify if the user has access to the subject
    const firstMark = marks[0];
    if (!firstMark) {
      return res.status(400).json({ message: 'No marks provided' });
    }

    const subject = await Subject.findByPk(firstMark.subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Only allow faculty assigned to the subject or admin to update marks
    if (req.user.role !== 'admin' && subject.facultyId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update these marks' });
    }

    // Process each mark
    const results = await Promise.all(marks.map(async (mark) => {
      // Find existing mark
      const existingMark = await Marks.findOne({
        where: {
          studentId: mark.studentId,
          subjectId: mark.subjectId,
          assessmentType: mark.assessmentType
        },
        transaction
      });

      if (existingMark) {
        // Update existing mark
        return existingMark.update({
          marks: mark.marks
        }, { transaction });
      } else {
        // Create new mark
        return Marks.create(mark, { transaction });
      }
    }));

    await transaction.commit();
    res.status(201).json(results);
  } catch (error) {
    await transaction.rollback();
    console.error('Error saving marks:', error);
    res.status(400).json({ 
      message: 'Error saving marks', 
      error: error.message 
    });
  }
});

// Get student marks
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only view their own marks
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view these marks' });
    }

    const marks = await Marks.findAll({
      where: { studentId },
      include: [{
        model: Subject,
        attributes: ['id', 'subjectName', 'subjectCode', 'year', 'semester', 'branch']
      }]
    });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ 
      message: 'Error fetching student marks', 
      error: error.message 
    });
  }
});

// Get marks by subject for admin
router.get('/subject/:subjectId', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const marks = await Marks.findAll({
      where: { subjectId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'studentId']
      }]
    });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching subject marks:', error);
    res.status(500).json({ 
      message: 'Error fetching subject marks', 
      error: error.message 
    });
  }
});

module.exports = router; 