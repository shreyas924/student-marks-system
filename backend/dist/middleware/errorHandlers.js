"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const logger_1 = require("../utils/logger");
const notFoundHandler = (req, res) => {
    logger_1.logger.warn(`404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.path,
        method: req.method
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    logger_1.logger.error('Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code,
        path: req.path,
        method: req.method
    });
    res.status(status).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            code: err.code
        })
    });
};
exports.errorHandler = errorHandler;
