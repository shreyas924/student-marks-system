"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const Student_1 = require("../models/Student");
const Faculty_1 = require("../models/Faculty");
const auth_1 = require("../utils/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
// Validation middleware
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('role')
        .isIn(['student', 'faculty'])
        .withMessage('Role must be either student or faculty'),
    // Conditional validation for student fields
    (0, express_validator_1.body)('studentId')
        .if((0, express_validator_1.body)('role').equals('student'))
        .matches(/^\d{2}[A-Z]{2}\d{3}$/)
        .withMessage('Student ID must be in format: YYBRXXX (e.g., 21CE123)'),
    (0, express_validator_1.body)('department')
        .if((0, express_validator_1.body)('role').equals('student'))
        .notEmpty()
        .withMessage('Department is required for students'),
    (0, express_validator_1.body)('branch')
        .if((0, express_validator_1.body)('role').equals('student'))
        .notEmpty()
        .withMessage('Branch is required for students'),
    (0, express_validator_1.body)('currentYear')
        .if((0, express_validator_1.body)('role').equals('student'))
        .isInt({ min: 1, max: 4 })
        .withMessage('Current year must be between 1 and 4'),
    (0, express_validator_1.body)('currentSemester')
        .if((0, express_validator_1.body)('role').equals('student'))
        .isInt({ min: 1, max: 8 })
        .withMessage('Current semester must be between 1 and 8'),
    (0, express_validator_1.body)('academicYear')
        .if((0, express_validator_1.body)('role').equals('student'))
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    // Conditional validation for faculty fields
    (0, express_validator_1.body)('department')
        .if((0, express_validator_1.body)('role').equals('faculty'))
        .notEmpty()
        .withMessage('Department is required for faculty'),
];
// Login route
router.post('/login', loginValidation, validation_1.validateRequest, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models_1.User.findOne({ where: { email } });
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
        const token = (0, auth_1.generateToken)(user);
        res.json({
            status: 'success',
            data: {
                token,
                user: user.toJSON(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to login',
        });
    }
});
// Register route
router.post('/register', registerValidation, validation_1.validateRequest, async (req, res) => {
    const t = await database_1.default.transaction();
    try {
        const { email, password, firstName, lastName, role, ...additionalData } = req.body;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already registered',
            });
        }
        // Create user with basic information
        const user = await models_1.User.create({
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
            const existingStudent = await Student_1.Student.findOne({ where: { studentId } });
            if (existingStudent) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Student ID already exists',
                });
            }
            await Student_1.Student.create({
                userId: user.id,
                studentId,
                department,
                branch,
                currentYear,
                currentSemester,
                academicYear,
            }, { transaction: t });
        }
        else if (role === 'faculty') {
            const { facultyId, department } = additionalData;
            // Check if faculty ID already exists
            const existingFaculty = await Faculty_1.Faculty.findOne({ where: { facultyId } });
            if (existingFaculty) {
                await t.rollback();
                return res.status(400).json({
                    status: 'error',
                    message: 'Faculty ID already exists',
                });
            }
            await Faculty_1.Faculty.create({
                userId: user.id,
                facultyId,
                department,
            }, { transaction: t });
        }
        await t.commit();
        const token = (0, auth_1.generateToken)(user);
        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: user.toJSON(),
            },
        });
    }
    catch (error) {
        await t.rollback();
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to register user',
        });
    }
});
exports.default = router;
