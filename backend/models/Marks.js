const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Subject = require('./Subject');

const Marks = sequelize.define('Marks', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id'
    }
  },
  assessmentType: {
    type: DataTypes.ENUM('Assignment', 'CA', 'Midterm', 'Term Work', 'Theory'),
    allowNull: false
  },
  marks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Marks cannot be less than 0'
      },
      max: {
        args: [100],
        msg: 'Marks cannot be more than 100'
      }
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'subjectId', 'assessmentType']
    }
  ]
});

// Add associations
Marks.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Marks.belongsTo(Subject, { foreignKey: 'subjectId' });

module.exports = Marks; 