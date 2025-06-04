import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { User, Subject, Marks } from '../models';
import { authenticate, authorize, AuthRequest } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Validation rules
const marksValidation = [
  body('studentId').isInt().withMessage('Valid student ID is required'),
  body('subjectId').isInt().withMessage('Valid subject ID is required'),
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('internalMarks')
    .isFloat({ min: 0, max: 40 })
    .withMessage('Internal marks must be between 0 and 40'),
  body('externalMarks')
    .isFloat({ min: 0, max: 60 })
    .withMessage('External marks must be between 0 and 60'),
];

// Get all marks (admin and faculty only)
router.get(
  '/',
  authenticate,
  authorize('admin', 'faculty'),
  async (req: AuthRequest, res) => {
    try {
      const marks = await Marks.findAll({
        include: [
          { model: User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
          { model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] },
        ],
      });

      res.json({
        status: 'success',
        data: marks,
      });
    } catch (error) {
      logger.error('Error fetching marks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch marks',
      });
    }
  }
);

// Get student's marks
router.get(
  '/student/:studentId',
  authenticate,
  authorize('admin', 'faculty'),
  param('studentId').isInt(),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { studentId } = req.params;

      const student = await User.findOne({
        where: { id: studentId, role: 'student' },
        attributes: ['id', 'firstName', 'lastName', 'email'],
      });

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found',
        });
      }

      const marks = await Marks.findAll({
        where: { studentId },
        include: [
          {
            model: Subject,
            attributes: ['id', 'code', 'name', 'credits'],
          },
        ],
      });

      res.json({
        status: 'success',
        data: {
          student,
          marks,
        },
      });
    } catch (error) {
      logger.error('Error fetching student marks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch student marks',
      });
    }
  }
);

// Add or update marks
router.post(
  '/',
  authenticate,
  authorize('faculty'),
  body('studentId').isInt(),
  body('subjectId').isInt(),
  body('marksValue')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Marks must be between 0 and 100'),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { studentId, subjectId, marksValue } = req.body;

      // Verify student exists
      const student = await User.findOne({
        where: { id: studentId, role: 'student' },
      });

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found',
        });
      }

      // Verify subject exists and faculty is assigned to it
      const subject = await Subject.findOne({
        where: { id: subjectId },
        include: [
          {
            model: User,
            as: 'assignedFaculty',
            where: { id: req.user?.id },
            attributes: [],
          },
        ],
      });

      if (!subject) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to add marks for this subject',
        });
      }

      // Add or update marks
      const [marks, created] = await Marks.upsert({
        studentId,
        subjectId,
        marksValue,
      });

      res.json({
        status: 'success',
        message: `Marks ${created ? 'added' : 'updated'} successfully`,
        data: marks,
      });
    } catch (error) {
      logger.error('Error adding/updating marks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add/update marks',
      });
    }
  }
);

// Update marks (faculty and admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'faculty'),
  param('id').isInt(),
  marksValidation,
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const marksData = req.body;

      const marks = await Marks.findByPk(id);
      if (!marks) {
        return res.status(404).json({
          status: 'error',
          message: 'Marks not found',
        });
      }

      await marks.update(marksData);

      res.json({
        status: 'success',
        data: marks,
      });
    } catch (error) {
      logger.error('Error updating marks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update marks',
      });
    }
  }
);

// Delete marks (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const marks = await Marks.findByPk(id);
      if (!marks) {
        return res.status(404).json({
          status: 'error',
          message: 'Marks not found',
        });
      }

      await marks.destroy();

      res.json({
        status: 'success',
        message: 'Marks deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting marks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete marks',
      });
    }
  }
);

// Publish/Unpublish marks (admin and faculty only)
router.patch(
  '/:id/publish',
  authenticate,
  authorize('admin', 'faculty'),
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body as { isPublished: boolean };

      const marks = await Marks.findByPk(id);
      if (!marks) {
        return res.status(404).json({
          status: 'error',
          message: 'Marks not found',
        });
      }

      await marks.update({ isPublished } as any); // Using type assertion as temporary fix

      res.json({
        status: 'success',
        message: `Marks ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: marks,
      });
    } catch (error) {
      logger.error('Error updating marks publication status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update marks publication status',
      });
    }
  }
);

export default router; 