const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcademicStructure = sequelize.define('AcademicStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  branch: {
    type: DataTypes.ENUM('Computer Engineering', 'Information Technology', 'Artificial Intelligence and Data Science'),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 8
    }
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = AcademicStructure; 