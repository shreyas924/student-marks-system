"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
exports.logger = winston_1.default.createLogger({
    levels: logLevels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
    ],
});
const setupLogger = () => {
    // Set log level from environment variable
    const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
    exports.logger.level = Object.keys(logLevels).includes(logLevel) ? logLevel : 'info';
    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
        exports.logger.add(new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        }));
    }
    exports.logger.info(`Logger initialized with level: ${exports.logger.level}`);
};
exports.setupLogger = setupLogger;
