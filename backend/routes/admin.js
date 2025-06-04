const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { 
  AcademicStructure, 
  SubjectAssignment, 
  User, 
  Marks, 
  CGPA, 
  Subject, 
  FacultySubject 
} = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Middleware to ensure admin access
router.use(authenticateToken, authorize('admin'));

// Get all academic structures
router.get('/academic-structures', async (req, res) => {
  try {
    const structures = await AcademicStructure.findAll({
      order: [['year', 'ASC'], ['semester', 'ASC']]
    });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all faculty members
router.get('/faculty', async (req, res) => {
  try {
    const faculty = await User.findAll({
      where: {
        role: 'faculty'
      },
      attributes: ['id', 'name', 'email', 'facultyId']
    });
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Failed to fetch faculty' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.findAll({
      where: {
        role: 'student'
      },
      attributes: ['id', 'name', 'email', 'studentId', 'branch', 'currentYear', 'currentSemester']
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get all subject assignments with faculty and subject details
router.get('/subject-assignments', async (req, res) => {
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
    console.error('Error fetching subject assignments:', error);
    res.status(500).json({ message: 'Failed to fetch subject assignments' });
  }
});

// Assign subject to faculty
router.post('/assign-subject', async (req, res) => {
  const { subjectName, subjectCode, facultyId, year, semester, branch } = req.body;

  try {
    // Validate faculty exists
    const faculty = await User.findOne({
      where: { id: facultyId, role: 'faculty' }
    });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Create the subject
      const subject = await Subject.create({
        name: subjectName,
        code: subjectCode,
        facultyId,
        year,
        semester,
        branch
      }, { transaction: t });

      // Create the subject assignment
      const assignment = await SubjectAssignment.create({
        facultyId,
        subjectId: subject.id,
        academicYear: `${year}-${semester}`,
        isActive: true
      }, { transaction: t });

      // Return both the subject and assignment
      return { subject, assignment };
    });

    // Fetch the complete assignment with faculty and subject details
    const completeAssignment = await SubjectAssignment.findOne({
      where: { id: result.assignment.id },
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

    res.status(201).json(completeAssignment);
  } catch (error) {
    console.error('Error assigning subject:', error);
    res.status(500).json({ 
      message: 'Error assigning subject',
      error: error.message 
    });
  }
});

// Toggle subject assignment active status
router.patch('/subject-assignments/:id/toggle-status', async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Subject assignment not found' });
    }

    assignment.isActive = !assignment.isActive;
    await assignment.save();

    res.json({ message: 'Status updated successfully', assignment });
  } catch (error) {
    console.error('Error toggling subject assignment status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Get students by academic structure
router.get('/students/:structureId', async (req, res) => {
  try {
    const structure = await AcademicStructure.findByPk(req.params.structureId);
    if (!structure) {
      return res.status(404).json({ message: 'Academic structure not found' });
    }

    const students = await User.findAll({
      where: {
        role: 'student',
        branch: structure.branch,
        currentYear: structure.year,
        currentSemester: structure.semester
      },
      attributes: ['id', 'name', 'email', 'studentId', 'cgpa']
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update subject assignment
router.put('/subject-assignments/:id', async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Subject assignment not found' });
    }

    await assignment.update(req.body);
    res.json(assignment);
  } catch (error) {
    console.error('Error updating subject assignment:', error);
    res.status(500).json({ message: 'Error updating subject assignment' });
  }
});

// Get performance report
router.get('/performance-report', async (req, res) => {
  try {
    const { branch, year, semester } = req.query;

    const students = await User.findAll({
      where: {
        role: 'student',
        branch,
        currentYear: year,
        currentSemester: semester
      },
      attributes: ['id', 'name', 'studentId']
    });

    const studentIds = students.map(s => s.id);

    const marks = await Marks.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'subjectAssignment',
        where: {
          branch,
          year,
          semester
        },
        attributes: ['subject', 'subjectCode']
      }],
      where: {
        studentId: {
          [Op.in]: studentIds
        }
      }
    });

    const cgpa = await CGPA.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds
        },
        semester
      }
    });

    // Format the report
    const report = students.map(student => {
      const studentMarks = marks.filter(m => m.studentId === student.id);
      const studentCGPA = cgpa.find(c => c.studentId === student.id);

      return {
        studentId: student.studentId,
        name: student.name,
        subjects: studentMarks.map(mark => ({
          subject: mark.subjectAssignment.subject,
          subjectCode: mark.subjectAssignment.subjectCode,
          totalMarks: mark.totalMarks,
          grade: mark.grade
        })),
        gpa: studentCGPA?.gpa || 0,
        cgpa: studentCGPA?.cgpa || 0
      };
    });

    res.json(report);
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ message: 'Error generating performance report' });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: SubjectAssignment,
        as: 'subjectAssignments',
        include: [{
          model: User,
          as: 'assignedFaculty',
          attributes: ['id', 'name', 'email']
        }]
      }]
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new subject
router.post('/subjects', async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update subject
router.put('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    await subject.update(req.body);
    res.json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    await subject.destroy();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subjects by year, semester, and branch
router.get('/subjects/filter', async (req, res) => {
  const { year, semester, branch } = req.query;
  try {
    const subjects = await Subject.findAll({
      where: {
        year: year ? parseInt(year) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        branch: branch || undefined
      }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign faculty to subject
router.post('/faculty-assignments', async (req, res) => {
  try {
    const { facultyId, subjectId, academicYear } = req.body;
    
    // Check if faculty exists and is actually a faculty member
    const faculty = await User.findOne({
      where: { id: facultyId, role: 'faculty' }
    });
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    // Check if subject exists
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Create faculty assignment
    const assignment = await FacultySubject.create({
      facultyId,
      subjectId,
      academicYear
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update faculty assignment
router.put('/faculty-assignments/:id', async (req, res) => {
  try {
    const assignment = await FacultySubject.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Faculty assignment not found' });
    }
    await assignment.update(req.body);
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete faculty assignment
router.delete('/faculty-assignments/:id', async (req, res) => {
  try {
    const assignment = await FacultySubject.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Faculty assignment not found' });
    }
    await assignment.destroy();
    res.json({ message: 'Faculty assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 