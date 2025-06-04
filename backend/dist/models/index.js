"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Faculty = exports.Student = exports.Marks = exports.Subject = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Subject_1 = __importDefault(require("./Subject"));
exports.Subject = Subject_1.default;
const Marks_1 = __importDefault(require("./Marks"));
exports.Marks = Marks_1.default;
var Student_1 = require("./Student");
Object.defineProperty(exports, "Student", { enumerable: true, get: function () { return __importDefault(Student_1).default; } });
var Faculty_1 = require("./Faculty");
Object.defineProperty(exports, "Faculty", { enumerable: true, get: function () { return __importDefault(Faculty_1).default; } });
