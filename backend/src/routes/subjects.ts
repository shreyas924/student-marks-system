import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { Subject, User, Faculty } from '../models';
import { authenticate, authorize, AuthRequest } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Validation rules
const subjectValidation = [
  body('code')
    .notEmpty()
    .withMessage('Subject code is required')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  body('name')
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject name must be between 3 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
];

// Validation middleware for subject assignment
const validateSubjectAssignment = [
  body('subjectName').notEmpty().withMessage('Subject name is required'),
  body('subjectCode').notEmpty().withMessage('Subject code is required'),
  body('facultyId').isInt().withMessage('Faculty ID is required'),
  body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('branch').notEmpty().withMessage('Branch is required')
];

// Get all subjects
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.findAll({
      include: ['faculty']
    });

    res.json({
      status: 'success',
      data: subjects
    });
  } catch (error) {
    logger.error('Error fetching subjects:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subjects'
    });
  }
});

// Get subject by ID
router.get(
  '/:id',
  authenticate,
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      res.json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      logger.error('Error fetching subject:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subject',
      });
    }
  }
);

// Create new subject (admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  body('code').notEmpty().withMessage('Subject code is required'),
  body('name').notEmpty().withMessage('Subject name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('department').notEmpty().withMessage('Department is required'),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const subject = await Subject.create(req.body);

      res.status(201).json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      logger.error('Error creating subject:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create subject',
      });
    }
  }
);

// Update subject (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  body('code').optional().notEmpty().withMessage('Subject code cannot be empty'),
  body('name').optional().notEmpty().withMessage('Subject name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('credits').optional().isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      await subject.update(req.body);

      res.json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      logger.error('Error updating subject:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update subject',
      });
    }
  }
);

// Delete subject (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      await subject.destroy();

      res.json({
        status: 'success',
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting subject:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete subject',
      });
    }
  }
);

// Toggle subject active status (admin only)
router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByPk(id);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      await subject.update({ isActive: !subject.isActive });

      res.json({
        status: 'success',
        data: subject,
      });
    } catch (error) {
      logger.error('Error toggling subject status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to toggle subject status',
      });
    }
  }
);

// Assign subject to faculty
router.post('/assign', 
  authenticate,
  authorize('admin'),
  validateSubjectAssignment,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { subjectName, subjectCode, facultyId, year, semester, branch } = req.body;

      // Check if subject code already exists
      const existingSubject = await Subject.findOne({
        where: { code: subjectCode }
      });

      if (existingSubject) {
        return res.status(400).json({
          status: 'error',
          message: 'Subject code already exists'
        });
      }

      // Create new subject
      const subject = await Subject.create({
        name: subjectName,
        code: subjectCode,
        facultyId,
        year,
        semester,
        branch
      });

      res.status(201).json({
        status: 'success',
        data: subject
      });
    } catch (error) {
      logger.error('Error assigning subject:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign subject'
      });
    }
  }
);

// Get subject assignments
router.get('/assignments', authenticate, async (req: Request, res: Response) => {
  try {
    const assignments = await Subject.findAll({
      include: [{
        model: User,
        as: 'assignedFaculty',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        include: [{
          model: Faculty,
          as: 'facultyProfile',
          attributes: ['facultyId', 'department']
        }]
      }],
      attributes: ['id', 'name', 'code', 'isActive', 'year', 'semester', 'branch']
    });

    res.json({
      status: 'success',
      data: assignments
    });
  } catch (error) {
    logger.error('Error fetching subject assignments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subject assignments'
    });
  }
});

export default router; 