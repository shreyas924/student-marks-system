import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { User } from '../models';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { generateToken } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import sequelize from '../config/database';

const router = Router();

// Validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be either student, faculty, or admin'),
  // Conditional validation for student fields
  body('studentId')
    .if(body('role').equals('student'))
    .matches(/^\d{2}[A-Z]{2}\d{3}$/)
    .withMessage('Student ID must be in format: YYBRXXX (e.g., 21CE123)'),
  body('department')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Department is required for students'),
  body('branch')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Branch is required for students'),
  body('currentYear')
    .if(body('role').equals('student'))
    .isInt({ min: 1, max: 4 })
    .withMessage('Current year must be between 1 and 4'),
  body('currentSemester')
    .if(body('role').equals('student'))
    .isInt({ min: 1, max: 8 })
    .withMessage('Current semester must be between 1 and 8'),
  body('academicYear')
    .if(body('role').equals('student'))
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  // Conditional validation for faculty fields
  body('department')
    .if(body('role').equals('faculty'))
    .notEmpty()
    .withMessage('Department is required for faculty'),
];

// Login route
router.post('/login', loginValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Faculty, as: 'facultyProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is inactive',
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user);

    res.json({
      status: 'success',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    let errorMessage = 'Failed to login';
    if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
});

// Register route
router.post('/register', registerValidation, validateRequest, async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { email, password, firstName, lastName, role, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    // Create user with basic information
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      isActive: true,
    }, { transaction: t });

    // Create role-specific profile
    if (role === 'student') {
      const { studentId, department, branch, currentYear, currentSemester, academicYear } = additionalData;
      
      // Check if student ID already exists
      const existingStudent = await Student.findOne({ where: { studentId } });
      if (existingStudent) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Student ID already exists',
        });
      }

      await Student.create({
        userId: user.id,
        studentId,
        department,
        branch,
        currentYear,
        currentSemester,
        academicYear,
      }, { transaction: t });
    } else if (role === 'faculty') {
      const { facultyId, department } = additionalData;
      
      // Check if faculty ID already exists
      const existingFaculty = await Faculty.findOne({ where: { facultyId } });
      if (existingFaculty) {
        await t.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Faculty ID already exists',
        });
      }

      await Faculty.create({
        userId: user.id,
        facultyId,
        department,
      }, { transaction: t });
    }
    // Admin role doesn't need additional profile

    await t.commit();

    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    await t.rollback();
    logger.error('Registration error:', error);
    
    // Improved error handling
    let errorMessage = 'Failed to register user';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors.map((e: any) => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Email or ID already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
});

export default router; 