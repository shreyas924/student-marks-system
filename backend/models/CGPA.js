const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const CGPA = sequelize.define('CGPA', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
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
  },
  totalCredits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  earnedCredits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  gpa: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  cgpa: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (cgpa) => {
      // Calculate CGPA based on previous semesters
      if (cgpa.changed('gpa')) {
        const previousCGPAs = await CGPA.findAll({
          where: {
            studentId: cgpa.studentId,
            semester: { [sequelize.Op.lt]: cgpa.semester }
          },
          order: [['semester', 'ASC']]
        });

        let totalGPAPoints = cgpa.gpa * cgpa.earnedCredits;
        let totalCredits = cgpa.earnedCredits;

        previousCGPAs.forEach(prev => {
          totalGPAPoints += prev.gpa * prev.earnedCredits;
          totalCredits += prev.earnedCredits;
        });

        cgpa.cgpa = totalCredits > 0 ? (totalGPAPoints / totalCredits) : cgpa.gpa;
      }
    }
  }
});

// Associations
CGPA.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = CGPA; 