"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://your-production-url.com'
    : 'http://localhost:3000';
exports.corsOptions = {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
    optionsSuccessStatus: 200
};
