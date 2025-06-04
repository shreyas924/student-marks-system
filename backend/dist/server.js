"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Import configurations
const config_1 = require("./config");
const database_1 = require("./config/database");
const errorHandlers_1 = require("./middleware/errorHandlers");
const logger_1 = require("./utils/logger");
// Import routes
const routes_1 = require("./routes");
// Create Express app
const app = (0, express_1.default)();
// Apply CORS before any middleware or routes
app.use((0, cors_1.default)(config_1.corsOptions));
// Security middleware
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
const API_PREFIX = process.env.API_PREFIX || '/api';
app.use(`${API_PREFIX}/auth`, routes_1.authRoutes);
app.use(`${API_PREFIX}/subjects`, routes_1.subjectsRoutes);
app.use(`${API_PREFIX}/marks`, routes_1.marksRoutes);
app.use(`${API_PREFIX}/users`, routes_1.userRoutes);
app.use(`${API_PREFIX}/faculty`, routes_1.facultyRoutes);
app.use(`${API_PREFIX}/admin`, routes_1.adminRoutes);
// Error handling
app.use(errorHandlers_1.notFoundHandler);
app.use(errorHandlers_1.errorHandler);
// Start server function
const startServer = async () => {
    try {
        // Setup logger
        (0, logger_1.setupLogger)();
        // Setup database
        await (0, database_1.setupDatabase)();
        const PORT = parseInt(process.env.PORT || '5000', 10);
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger_1.logger.info('='.repeat(50));
            logger_1.logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
            logger_1.logger.info(`Server is listening on port ${PORT}`);
            logger_1.logger.info(`CORS enabled for origin: ${config_1.corsOptions.origin}`);
            logger_1.logger.info('='.repeat(50));
        });
        // Graceful shutdown
        const shutdown = async () => {
            logger_1.logger.info('Shutting down gracefully...');
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
