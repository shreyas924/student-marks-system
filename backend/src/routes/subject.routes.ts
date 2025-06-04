import { Router } from 'express';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Mark } from '../models/Mark';
import { auth } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';

const router = Router();

// Validation middleware for subject assignment
const validateSubjectAssignment = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('facultyId').isInt().withMessage('Valid faculty ID is required'),
  body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('semester').custom((value, { req }) => {
    const year = parseInt(req.body.year);
    const sem = parseInt(value);
    const validSemesters = {
      1: [1, 2],
      2: [3, 4],
      3: [5, 6],
      4: [7, 8]
    };
    if (!validSemesters[year].includes(sem)) {
      throw new Error('Invalid semester for selected year');
    }
    return true;
  }),
  body('branch').isIn(['CE', 'IT', 'AIDS']).withMessage('Invalid branch')
];

// Get all faculty members
router.get('/faculty', auth, checkRole(['admin']), async (req, res) => {
  try {
    const faculty = await User.findAll({
      where: { role: 'faculty', isActive: true },
      include: ['facultyProfile']
    });
    res.json({ status: 'success', data: faculty });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch faculty list' });
  }
});

// Assign subject to faculty
router.post('/assign', 
  auth, 
  checkRole(['admin']),
  validateSubjectAssignment,
  validateRequest,
  async (req, res) => {
    try {
      const { name, code, facultyId, year, semester, branch } = req.body;

      // Check if faculty exists
      const faculty = await User.findOne({
        where: { id: facultyId, role: 'faculty', isActive: true }
      });

      if (!faculty) {
        return res.status(404).json({
          status: 'error',
          message: 'Faculty not found'
        });
      }

      // Check if subject code is unique
      const existingSubject = await Subject.findOne({
        where: { code }
      });

      if (existingSubject) {
        return res.status(400).json({
          status: 'error',
          message: 'Subject code already exists'
        });
      }

      // Create new subject
      const subject = await Subject.create({
        name,
        code,
        facultyId,
        year,
        semester,
        branch,
        isActive: true
      });

      res.status(201).json({
        status: 'success',
        data: subject
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign subject'
      });
    }
});

// Get faculty's assigned subjects
router.get('/faculty-subjects', 
  auth, 
  checkRole(['faculty']),
  async (req, res) => {
    try {
      const subjects = await Subject.findAll({
        where: {
          facultyId: req.user.id,
          isActive: true
        }
      });

      res.json({
        status: 'success',
        data: subjects
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subjects'
      });
    }
});

// Get students for marks entry
router.get('/students/:subjectId',
  auth,
  checkRole(['faculty']),
  async (req, res) => {
    try {
      const subject = await Subject.findOne({
        where: {
          id: req.params.subjectId,
          facultyId: req.user.id,
          isActive: true
        }
      });

      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found'
        });
      }

      // Get students matching subject criteria
      const students = await Student.findAll({
        where: {
          year: subject.year,
          semester: subject.semester,
          branch: subject.branch,
          isActive: true
        },
        order: [['rollNo', 'ASC']]
      });

      res.json({
        status: 'success',
        data: students
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch students'
      });
    }
});

// Save marks
router.post('/marks/:subjectId',
  auth,
  checkRole(['faculty']),
  [
    body('assessmentType').isIn(['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory'])
      .withMessage('Invalid assessment type'),
    body('marks.*.studentId').isInt().withMessage('Valid student ID is required'),
    body('marks.*.value').isFloat({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { assessmentType, marks } = req.body;
      const subjectId = req.params.subjectId;

      // Verify subject belongs to faculty
      const subject = await Subject.findOne({
        where: {
          id: subjectId,
          facultyId: req.user.id,
          isActive: true
        }
      });

      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found'
        });
      }

      // Save marks for each student
      await Promise.all(marks.map(async (mark) => {
        // Verify student belongs to subject's year/sem/branch
        const student = await Student.findOne({
          where: {
            id: mark.studentId,
            year: subject.year,
            semester: subject.semester,
            branch: subject.branch,
            isActive: true
          }
        });

        if (!student) {
          throw new Error(`Student ${mark.studentId} not found or not eligible`);
        }

        // Update or create marks
        await Mark.upsert({
          subjectId,
          studentId: mark.studentId,
          assessmentType,
          value: mark.value
        });
      }));

      res.json({
        status: 'success',
        message: 'Marks saved successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to save marks'
      });
    }
});

export default router; 