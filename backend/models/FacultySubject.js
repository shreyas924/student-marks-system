const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Subject = require('./Subject');

const FacultySubject = sequelize.define('FacultySubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Academic year is required'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Define associations
FacultySubject.belongsTo(User, {
  foreignKey: {
    name: 'facultyId',
    allowNull: false
  },
  as: 'faculty'
});

FacultySubject.belongsTo(Subject, {
  foreignKey: {
    name: 'subjectId',
    allowNull: false
  },
  as: 'subject'
});

module.exports = FacultySubject; 