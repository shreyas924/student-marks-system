"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = exports.facultyRoutes = exports.userRoutes = exports.marksRoutes = exports.subjectsRoutes = exports.authRoutes = void 0;
const auth_1 = __importDefault(require("./auth"));
exports.authRoutes = auth_1.default;
const subjects_1 = __importDefault(require("./subjects"));
exports.subjectsRoutes = subjects_1.default;
const marks_1 = __importDefault(require("./marks"));
exports.marksRoutes = marks_1.default;
const users_1 = __importDefault(require("./users"));
exports.userRoutes = users_1.default;
const faculty_1 = __importDefault(require("./faculty"));
exports.facultyRoutes = faculty_1.default;
const admin_1 = __importDefault(require("./admin"));
exports.adminRoutes = admin_1.default;
