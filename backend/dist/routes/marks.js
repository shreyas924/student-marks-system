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
const marksValidation = [
    (0, express_validator_1.body)('studentId').isInt().withMessage('Valid student ID is required'),
    (0, express_validator_1.body)('subjectId').isInt().withMessage('Valid subject ID is required'),
    (0, express_validator_1.body)('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),
    (0, express_validator_1.body)('semester')
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    (0, express_validator_1.body)('internalMarks')
        .isFloat({ min: 0, max: 40 })
        .withMessage('Internal marks must be between 0 and 40'),
    (0, express_validator_1.body)('externalMarks')
        .isFloat({ min: 0, max: 60 })
        .withMessage('External marks must be between 0 and 60'),
];
// Get all marks (admin and faculty only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty'), async (req, res) => {
    try {
        const marks = await models_1.Marks.findAll({
            include: [
                { model: models_1.User, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
                { model: models_1.Subject, as: 'subject', attributes: ['id', 'code', 'name'] },
            ],
        });
        res.json({
            status: 'success',
            data: marks,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch marks',
        });
    }
});
// Get student's marks
router.get('/student/:studentId', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty'), (0, express_validator_1.param)('studentId').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await models_1.User.findOne({
            where: { id: studentId, role: 'student' },
            attributes: ['id', 'firstName', 'lastName', 'email'],
        });
        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
        }
        const marks = await models_1.Marks.findAll({
            where: { studentId },
            include: [
                {
                    model: models_1.Subject,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching student marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student marks',
        });
    }
});
// Add or update marks
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('faculty'), (0, express_validator_1.body)('studentId').isInt(), (0, express_validator_1.body)('subjectId').isInt(), (0, express_validator_1.body)('marksValue')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Marks must be between 0 and 100'), validation_1.validateRequest, async (req, res) => {
    try {
        const { studentId, subjectId, marksValue } = req.body;
        // Verify student exists
        const student = await models_1.User.findOne({
            where: { id: studentId, role: 'student' },
        });
        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
        }
        // Verify subject exists and faculty is assigned to it
        const subject = await models_1.Subject.findOne({
            where: { id: subjectId },
            include: [
                {
                    model: models_1.User,
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
        const [marks, created] = await models_1.Marks.upsert({
            studentId,
            subjectId,
            marksValue,
        });
        res.json({
            status: 'success',
            message: `Marks ${created ? 'added' : 'updated'} successfully`,
            data: marks,
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding/updating marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add/update marks',
        });
    }
});
// Update marks (faculty and admin only)
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty'), (0, express_validator_1.param)('id').isInt(), marksValidation, validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const marksData = req.body;
        const marks = await models_1.Marks.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error updating marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update marks',
        });
    }
});
// Delete marks (admin only)
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const marks = await models_1.Marks.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error deleting marks:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete marks',
        });
    }
});
// Publish/Unpublish marks (admin and faculty only)
router.patch('/:id/publish', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty'), (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;
        const marks = await models_1.Marks.findByPk(id);
        if (!marks) {
            return res.status(404).json({
                status: 'error',
                message: 'Marks not found',
            });
        }
        await marks.update({ isPublished }); // Using type assertion as temporary fix
        res.json({
            status: 'success',
            message: `Marks ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: marks,
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating marks publication status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update marks publication status',
        });
    }
});
exports.default = router;
