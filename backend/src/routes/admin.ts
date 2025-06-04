import { Router } from 'express';
import { body, param } from 'express-validator';
import { User, Subject, Marks } from '../models';
import { authenticate, authorize, AuthRequest } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Get system statistics
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res) => {
    try {
      const [
        totalStudents,
        totalFaculty,
        totalSubjects,
        totalMarks,
      ] = await Promise.all([
        User.count({ where: { role: 'student' } }),
        User.count({ where: { role: 'faculty' } }),
        Subject.count(),
        Marks.count(),
      ]);

      res.json({
        status: 'success',
        data: {
          totalStudents,
          totalFaculty,
          totalSubjects,
          totalMarks,
        },
      });
    } catch (error) {
      logger.error('Error fetching system stats:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch system statistics',
      });
    }
  }
);

// Assign faculty to subject
router.post(
  '/assign-faculty',
  authenticate,
  authorize('admin'),
  body('facultyId').isInt(),
  body('subjectId').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { facultyId, subjectId } = req.body;

      // Verify faculty exists and is a faculty member
      const faculty = await User.findOne({
        where: { id: facultyId, role: 'faculty' },
      });

      if (!faculty) {
        return res.status(404).json({
          status: 'error',
          message: 'Faculty member not found',
        });
      }

      // Verify subject exists
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      // Check if assignment already exists
      const assignedFaculty = await subject.getAssignedFaculty();
      const isAlreadyAssigned = assignedFaculty.some(f => f.id === facultyId);

      if (isAlreadyAssigned) {
        return res.status(400).json({
          status: 'error',
          message: 'Faculty is already assigned to this subject',
        });
      }

      await subject.addAssignedFaculty(faculty);

      res.json({
        status: 'success',
        message: 'Faculty assigned to subject successfully',
      });
    } catch (error) {
      logger.error('Error assigning faculty:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign faculty to subject',
      });
    }
  }
);

// Remove faculty from subject
router.delete(
  '/remove-faculty',
  authenticate,
  authorize('admin'),
  body('facultyId').isInt(),
  body('subjectId').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { facultyId, subjectId } = req.body;

      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(404).json({
          status: 'error',
          message: 'Subject not found',
        });
      }

      // Check if faculty is assigned to the subject
      const assignedFaculty = await subject.getAssignedFaculty();
      const isAssigned = assignedFaculty.some(f => f.id === facultyId);

      if (!isAssigned) {
        return res.status(404).json({
          status: 'error',
          message: 'Faculty is not assigned to this subject',
        });
      }

      await subject.removeAssignedFaculty(facultyId);

      res.json({
        status: 'success',
        message: 'Faculty removed from subject successfully',
      });
    } catch (error) {
      logger.error('Error removing faculty:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove faculty from subject',
      });
    }
  }
);

// Toggle user account status
router.patch(
  '/users/:id/toggle-status',
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      // Prevent deactivating own account
      if (user.id === req.user?.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot deactivate your own account',
        });
      }

      await user.update({ isActive: !user.isActive });

      res.json({
        status: 'success',
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error toggling user status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to toggle user status',
      });
    }
  }
);

export default router; 