"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Get system statistics
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const [totalStudents, totalFaculty, totalSubjects, totalMarks,] = await Promise.all([
            models_1.User.count({ where: { role: 'student' } }),
            models_1.User.count({ where: { role: 'faculty' } }),
            models_1.Subject.count(),
            models_1.Marks.count(),
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching system stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch system statistics',
        });
    }
});
// Assign faculty to subject
router.post('/assign-faculty', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.body)('facultyId').isInt(), (0, express_validator_1.body)('subjectId').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { facultyId, subjectId } = req.body;
        // Verify faculty exists and is a faculty member
        const faculty = await models_1.User.findOne({
            where: { id: facultyId, role: 'faculty' },
        });
        if (!faculty) {
            return res.status(404).json({
                status: 'error',
                message: 'Faculty member not found',
            });
        }
        // Verify subject exists
        const subject = await models_1.Subject.findByPk(subjectId);
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
    }
    catch (error) {
        logger_1.logger.error('Error assigning faculty:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to assign faculty to subject',
        });
    }
});
// Remove faculty from subject
router.delete('/remove-faculty', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.body)('facultyId').isInt(), (0, express_validator_1.body)('subjectId').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { facultyId, subjectId } = req.body;
        const subject = await models_1.Subject.findByPk(subjectId);
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
    }
    catch (error) {
        logger_1.logger.error('Error removing faculty:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to remove faculty from subject',
        });
    }
});
// Toggle user account status
router.patch('/users/:id/toggle-status', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await models_1.User.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error toggling user status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle user status',
        });
    }
});
exports.default = router;
