const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Subject name is required'
      }
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Subject code is required'
      }
    }
  },
  facultyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Year must be between 1 and 4'
      },
      max: {
        args: [4],
        msg: 'Year must be between 1 and 4'
      }
    }
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Semester must be between 1 and 8'
      },
      max: {
        args: [8],
        msg: 'Semester must be between 1 and 8'
      },
      validateSemester(value) {
        const year = this.year;
        const validSemesters = {
          1: [1, 2],
          2: [3, 4],
          3: [5, 6],
          4: [7, 8]
        };
        if (!validSemesters[year].includes(value)) {
          throw new Error(`Invalid semester ${value} for year ${year}`);
        }
      }
    }
  },
  branch: {
    type: DataTypes.ENUM('CE', 'IT', 'AIDS'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Branch is required'
      }
    }
  },
  assessmentTypes: {
    type: DataTypes.ARRAY(DataTypes.ENUM({
      values: ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory']
    })),
    defaultValue: ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory']
  }
}, {
  timestamps: true
});

// Add associations
Subject.belongsTo(User, { as: 'faculty', foreignKey: 'facultyId' });

module.exports = Subject; 