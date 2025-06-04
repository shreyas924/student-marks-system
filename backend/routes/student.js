const express = require('express');
const router = express.Router();
const { authenticateToken, isStudent } = require('../middleware/auth');
const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');
const Marks = require('../models/Marks');
const CGPA = require('../models/CGPA');
const { Op } = require('sequelize');

// Get student's marks for current semester
router.get('/marks', authenticateToken, isStudent, async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id);
    
    const marks = await Marks.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'subjectAssignment',
        where: {
          year: student.currentYear,
          semester: student.currentSemester,
          branch: student.branch
        },
        attributes: ['subject', 'subjectCode']
      }],
      where: {
        studentId: req.user.id
      }
    });

    // Format the response
    const formattedMarks = marks.map(mark => ({
      id: mark.id,
      subject: mark.subjectAssignment.subject,
      subjectCode: mark.subjectAssignment.subjectCode,
      assignmentMarks: mark.assignmentMarks,
      midtermMarks: mark.midtermMarks,
      theoryMarks: mark.theoryMarks,
      practicalMarks: mark.practicalMarks,
      totalMarks: mark.totalMarks,
      grade: mark.grade
    }));

    res.json(formattedMarks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Error fetching marks' });
  }
});

// Get student's CGPA
router.get('/cgpa', authenticateToken, isStudent, async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id);
    
    const cgpa = await CGPA.findOne({
      where: {
        studentId: req.user.id,
        semester: student.currentSemester
      },
      order: [['updatedAt', 'DESC']]
    });

    if (!cgpa) {
      return res.status(404).json({ message: 'CGPA record not found' });
    }

    res.json(cgpa);
  } catch (error) {
    console.error('Error fetching CGPA:', error);
    res.status(500).json({ message: 'Error fetching CGPA' });
  }
});

// Get student's academic history
router.get('/academic-history', authenticateToken, isStudent, async (req, res) => {
  try {
    const cgpaHistory = await CGPA.findAll({
      where: {
        studentId: req.user.id
      },
      order: [['semester', 'ASC']]
    });

    const marksHistory = await Marks.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'subjectAssignment',
        attributes: ['subject', 'subjectCode', 'semester', 'year']
      }],
      where: {
        studentId: req.user.id
      },
      order: [[{ model: SubjectAssignment, as: 'subjectAssignment' }, 'semester', 'ASC']]
    });

    res.json({
      cgpaHistory,
      marksHistory: marksHistory.map(mark => ({
        id: mark.id,
        subject: mark.subjectAssignment.subject,
        subjectCode: mark.subjectAssignment.subjectCode,
        semester: mark.subjectAssignment.semester,
        year: mark.subjectAssignment.year,
        totalMarks: mark.totalMarks,
        grade: mark.grade
      }))
    });
  } catch (error) {
    console.error('Error fetching academic history:', error);
    res.status(500).json({ message: 'Error fetching academic history' });
  }
});

module.exports = router; 