"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marks = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("./User");
const Subject_1 = require("./Subject");
class Marks extends sequelize_1.Model {
}
exports.Marks = Marks;
Marks.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    studentId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    subjectId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'subjects',
            key: 'id',
        },
    },
    marksValue: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        },
    },
    grade: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    remarks: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'marks',
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'subjectId'],
        },
    ],
    hooks: {
        beforeSave: (marks) => {
            // Calculate grade based on marks
            const marksValue = marks.marksValue;
            let grade = '';
            if (marksValue >= 90)
                grade = 'A+';
            else if (marksValue >= 80)
                grade = 'A';
            else if (marksValue >= 70)
                grade = 'B';
            else if (marksValue >= 60)
                grade = 'C';
            else if (marksValue >= 50)
                grade = 'D';
            else
                grade = 'F';
            marks.grade = grade;
        },
    },
});
// Define associations
Marks.belongsTo(User_1.User, {
    foreignKey: 'studentId',
    as: 'student',
});
Marks.belongsTo(Subject_1.Subject, {
    foreignKey: 'subjectId',
    as: 'subject',
});
exports.default = Marks;
