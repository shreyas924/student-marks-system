"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation rules
const subjectValidation = [
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('Subject code is required')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Subject code must contain only uppercase letters and numbers'),
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Subject name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Subject name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required'),
    (0, express_validator_1.body)('credits')
        .isInt({ min: 1, max: 6 })
        .withMessage('Credits must be between 1 and 6'),
    (0, express_validator_1.body)('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    (0, express_validator_1.body)('department')
        .notEmpty()
        .withMessage('Department is required'),
];
// Get all subjects
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const subjects = await models_1.Subject.findAll({
            where: { isActive: true },
        });
        res.json({
            status: 'success',
            data: subjects,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching subjects:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch subjects',
        });
    }
});
// Get subject by ID
router.get('/:id', auth_1.authenticate, (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await models_1.Subject.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching subject:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch subject',
        });
    }
});
// Create new subject (admin only)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.body)('code').notEmpty().withMessage('Subject code is required'), (0, express_validator_1.body)('name').notEmpty().withMessage('Subject name is required'), (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'), (0, express_validator_1.body)('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'), (0, express_validator_1.body)('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'), (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'), validation_1.validateRequest, async (req, res) => {
    try {
        const subject = await models_1.Subject.create(req.body);
        res.status(201).json({
            status: 'success',
            data: subject,
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating subject:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create subject',
        });
    }
});
// Update subject (admin only)
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.param)('id').isInt(), (0, express_validator_1.body)('code').optional().notEmpty().withMessage('Subject code cannot be empty'), (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Subject name cannot be empty'), (0, express_validator_1.body)('description').optional().notEmpty().withMessage('Description cannot be empty'), (0, express_validator_1.body)('credits').optional().isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'), (0, express_validator_1.body)('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'), (0, express_validator_1.body)('department').optional().notEmpty().withMessage('Department cannot be empty'), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await models_1.Subject.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error updating subject:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update subject',
        });
    }
});
// Delete subject (admin only)
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await models_1.Subject.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error deleting subject:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete subject',
        });
    }
});
// Toggle subject active status (admin only)
router.patch('/:id/toggle-status', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await models_1.Subject.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error toggling subject status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle subject status',
        });
    }
});
exports.default = router;
