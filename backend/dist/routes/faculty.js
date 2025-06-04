"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Get all faculty members (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const faculty = await models_1.User.findAll({
            where: { role: 'faculty' },
            attributes: { exclude: ['password'] },
        });
        res.json({
            status: 'success',
            data: faculty,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching faculty members:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch faculty members',
        });
    }
});
// Get faculty member's assigned subjects
router.get('/subjects', auth_1.authenticate, (0, auth_1.authorize)('faculty'), async (req, res) => {
    try {
        const subjects = await models_1.Subject.findAll({
            include: [
                {
                    model: models_1.User,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching faculty subjects:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch faculty subjects',
        });
    }
});
// Get students for a subject
router.get('/subjects/:subjectId/students', auth_1.authenticate, (0, auth_1.authorize)('faculty'), (0, express_validator_1.param)('subjectId').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { subjectId } = req.params;
        // Verify faculty is assigned to this subject
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
                message: 'Not authorized to view this subject',
            });
        }
        const students = await models_1.User.findAll({
            where: { role: 'student' },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: models_1.Marks,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching students:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch students',
        });
    }
});
exports.default = router;
