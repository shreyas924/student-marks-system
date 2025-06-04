"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
class Student extends sequelize_1.Model {
}
exports.Student = Student;
Student.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    studentId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^\d{2}[A-Z]{2}\d{3}$/,
        },
    },
    department: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    branch: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    currentYear: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 4,
        },
    },
    currentSemester: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 8,
        },
    },
    academicYear: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{4}-\d{4}$/,
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'students',
});
// Define associations
Student.belongsTo(User_1.User, { foreignKey: 'userId', as: 'user' });
User_1.User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
exports.default = Student;
