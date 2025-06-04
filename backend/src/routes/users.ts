import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { User } from '../models';
import { Faculty } from '../models/Faculty';
import { authenticate, authorize, AuthRequest } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Get all users (admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
      });

      res.json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
      });
    }
  }
);

// Get user by ID
router.get(
  '/:id',
  authenticate,
  param('id').isInt(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Only admins can view other users' profiles
      if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id, 10)) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to view this profile',
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      res.json({
        status: 'success',
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user',
      });
    }
  }
);

// Update user
router.put(
  '/:id',
  authenticate,
  param('id').isInt(),
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('email').optional().isEmail(),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Only admins can update other users' profiles
      if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id, 10)) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to update this profile',
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      // Remove sensitive fields from update data
      delete updateData.password;
      delete updateData.role;

      await user.update(updateData);

      res.json({
        status: 'success',
        data: user.toJSON(),
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user',
      });
    }
  }
);

// Change password
router.post(
  '/:id/change-password',
  authenticate,
  param('id').isInt(),
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Users can only change their own password
      if (req.user?.id !== parseInt(id, 10)) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to change this password',
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect',
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        status: 'success',
        message: 'Password updated successfully',
      });
    } catch (error) {
      logger.error('Error changing password:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password',
      });
    }
  }
);

// Get all faculty members
router.get('/faculty', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Fetching faculty members', {
      user: req.user?.id,
      headers: req.headers,
      method: req.method,
      path: req.path
    });

    if (!req.user) {
      logger.error('No user found in request');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // First check if Faculty model exists and is properly associated
    try {
      const facultyMembers = await User.findAll({
        where: { 
          role: 'faculty', 
          isActive: true 
        },
        include: [{
          model: Faculty,
          as: 'facultyProfile',
          required: false, // Change to outer join to see if association works
          attributes: ['facultyId', 'department']
        }],
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      // Log the raw results for debugging
      logger.info('Faculty query results:', {
        count: facultyMembers.length,
        sample: facultyMembers.slice(0, 2)
      });

      if (!facultyMembers || facultyMembers.length === 0) {
        logger.warn('No active faculty members found');
        return res.json({
          status: 'success',
          data: []
        });
      }

      // Filter out any faculty without proper profiles if needed
      const validFacultyMembers = facultyMembers.filter(faculty => faculty.facultyProfile);

      logger.info(`Successfully fetched ${validFacultyMembers.length} faculty members`);
      res.json({
        status: 'success',
        data: validFacultyMembers
      });
    } catch (dbError: any) {
      logger.error('Database error while fetching faculty:', {
        error: dbError.message,
        stack: dbError.stack
      });
      throw new Error('Database error while fetching faculty');
    }
  } catch (error: any) {
    logger.error('Error fetching faculty members:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.id
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch faculty members'
    });
  }
});

export default router; 