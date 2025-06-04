"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Get all users (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const users = await models_1.User.findAll({
            attributes: { exclude: ['password'] },
        });
        res.json({
            status: 'success',
            data: users,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users',
        });
    }
});
// Get user by ID
router.get('/:id', auth_1.authenticate, (0, express_validator_1.param)('id').isInt(), validation_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        // Only admins can view other users' profiles
        if (req.user?.role !== 'admin' && req.user?.id !== parseInt(id, 10)) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to view this profile',
            });
        }
        const user = await models_1.User.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user',
        });
    }
});
// Update user
router.put('/:id', auth_1.authenticate, (0, express_validator_1.param)('id').isInt(), (0, express_validator_1.body)('firstName').optional().notEmpty(), (0, express_validator_1.body)('lastName').optional().notEmpty(), (0, express_validator_1.body)('email').optional().isEmail(), validation_1.validateRequest, async (req, res) => {
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
        const user = await models_1.User.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user',
        });
    }
});
// Change password
router.post('/:id/change-password', auth_1.authenticate, (0, express_validator_1.param)('id').isInt(), (0, express_validator_1.body)('currentPassword').notEmpty(), (0, express_validator_1.body)('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'), validation_1.validateRequest, async (req, res) => {
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
        const user = await models_1.User.findByPk(id);
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
    }
    catch (error) {
        logger_1.logger.error('Error changing password:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password',
        });
    }
});
exports.default = router;
