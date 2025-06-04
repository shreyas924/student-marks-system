const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Subject = require('./Subject');

const SubjectAssignment = sequelize.define('SubjectAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  facultyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Subjects',
      key: 'id'
    }
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['facultyId', 'subjectId', 'academicYear']
    }
  ]
});

// Add associations
SubjectAssignment.belongsTo(User, { foreignKey: 'facultyId', as: 'faculty' });
SubjectAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

module.exports = SubjectAssignment; 