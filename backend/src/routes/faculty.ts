import { Router } from 'express';
import { body, param } from 'express-validator';
import { User, Subject, Marks } from '../models';
import { authenticate, authorize, AuthRequest } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Get all faculty members (admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res) => {
    try {
      const faculty = await User.findAll({
        where: { role: 'faculty' },
        attributes: { exclude: ['password'] },
      });

      res.json({
        status: 'success',
        data: faculty,
      });
    } catch (error) {
      logger.error('Error fetching faculty members:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch faculty members',
      });
    }
  }
);

// Get faculty member's assigned subjects
router.get(
  '/subjects',
  authenticate,
  authorize('faculty'),
  async (req: AuthRequest, res) => {
    try {
      const subjects = await Subject.findAll({
        include: [
          {
            model: User,
            as: 'assignedFaculty',
            where: { id: req.user?.id },
            attributes: [],
          },
        ],
      });

      res.json({
        status: 'success',
        data: subjects,
      });
    } catch (error) {
      logger.error('Error fetching faculty subjects:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch faculty subjects',
      });
    }
  }
);

// Get students for a subject
router.get(
  '/subjects/:subjectId/students',
  authenticate,
  authorize('faculty'),
  param('subjectId').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { subjectId } = req.params;

      // Verify faculty is assigned to this subject
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
          message: 'Not authorized to view this subject',
        });
      }

      const students = await User.findAll({
        where: { role: 'student' },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Marks,
            as: 'studentMarks',
            where: { subjectId },
            required: false,
          },
        ],
      });

      res.json({
        status: 'success',
        data: students,
      });
    } catch (error) {
      logger.error('Error fetching students:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch students',
      });
    }
  }
);

export default router; 