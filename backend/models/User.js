const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
        msg: 'Name is required'
      },
      len: {
        args: [2, 50],
        msg: 'Name must be between 2 and 50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'This email is already registered'
    },
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'faculty', 'student'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Role is required'
      },
      isIn: {
        args: [['admin', 'faculty', 'student']],
        msg: 'Invalid role selected'
      }
    }
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      customValidator(value) {
        if ((this.role === 'faculty' || this.role === 'student') && !value) {
          throw new Error('Department is required for faculty and students');
        }
      }
    }
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
      msg: 'This Student ID is already registered'
    },
    validate: {
      customValidator(value) {
        if (this.role === 'student' && !value) {
          throw new Error('Student ID is required for students');
        }
      }
    }
  },
  facultyId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
      msg: 'This Faculty ID is already registered'
    },
    validate: {
      customValidator(value) {
        if (this.role === 'faculty' && !value) {
          throw new Error('Faculty ID is required for faculty members');
        }
      }
    }
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      customValidator(value) {
        if (this.role === 'student' && !value) {
          throw new Error('Branch is required for students');
        }
      }
    }
  },
  currentYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Current year must be between 1 and 4'
      },
      max: {
        args: [4],
        msg: 'Current year must be between 1 and 4'
      },
      customValidator(value) {
        if (this.role === 'student' && !value) {
          throw new Error('Current year is required for students');
        }
      }
    }
  },
  currentSemester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Current semester must be between 1 and 8'
      },
      max: {
        args: [8],
        msg: 'Current semester must be between 1 and 8'
      },
      customValidator(value) {
        if (this.role === 'student' && !value) {
          throw new Error('Current semester is required for students');
        }
      }
    }
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      customValidator(value) {
        if (this.role === 'student' && !value) {
          throw new Error('Academic year is required for students');
        }
      }
    }
  },
  cgpa: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'CGPA cannot be less than 0'
      },
      max: {
        args: [10],
        msg: 'CGPA cannot be more than 10'
      }
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: async (user) => {
      // Convert empty strings to null for unique fields
      if (user.studentId === '') user.studentId = null;
      if (user.facultyId === '') user.facultyId = null;
    },
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

module.exports = User; 