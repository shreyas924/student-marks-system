const { Sequelize } = require('sequelize');
require('dotenv').config();

// Default configuration for development
const defaultConfig = {
  username: 'postgres',
  password: 'postgres',
  database: 'student_marks_system',
  host: 'localhost',
  port: 5432,
  dialect: 'postgres'
};

// Get database configuration
const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      config: {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: process.env.NODE_ENV === 'production' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {},
        logging: console.log
      }
    };
  }

  return {
    url: `postgres://${defaultConfig.username}:${defaultConfig.password}@${defaultConfig.host}:${defaultConfig.port}/${defaultConfig.database}`,
    config: {
      ...defaultConfig,
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true
      }
    }
  };
};

// Create Sequelize instance
const { url, config } = getDbConfig();
const sequelize = new Sequelize(url, config);

// Define enum types
const enumTypes = {
  UserRole: {
    name: 'enum_Users_role',
    values: ['admin', 'faculty', 'student']
  },
  SubjectBranch: {
    name: 'enum_Subjects_branch',
    values: ['CE', 'IT', 'AIDS']
  },
  AssessmentType: {
    name: 'enum_Subjects_assessmentTypes',
    values: ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory']
  },
  MarksAssessmentType: {
    name: 'enum_Marks_assessmentType',
    values: ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory']
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const force = process.env.FORCE_SYNC === 'true';

    if (force) {
      try {
        // Drop and recreate schema
        await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE');
        await sequelize.query('CREATE SCHEMA public');
        await sequelize.query('GRANT ALL ON SCHEMA public TO postgres');
        await sequelize.query('GRANT ALL ON SCHEMA public TO public');
        console.log('Schema reset completed');

        // Create enum types
        for (const enumType of Object.values(enumTypes)) {
          const createEnumQuery = `
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumType.name}') THEN
                CREATE TYPE "${enumType.name}" AS ENUM (${enumType.values.map(v => `'${v}'`).join(', ')});
              END IF;
            END
            $$;
          `;
          await sequelize.query(createEnumQuery);
          console.log(`Created enum type: ${enumType.name}`);
        }
      } catch (error) {
        console.error('Error during schema/enum setup:', error);
        throw error;
      }
    }

    // Import models
    const {
      User,
      Subject,
      SubjectAssignment,
      Marks,
      CGPA,
      AcademicStructure,
      FacultySubject
    } = require('../models');

    // Sync models in dependency order
    const models = [
      { model: User, name: 'User' },
      { model: Subject, name: 'Subject' },
      { model: SubjectAssignment, name: 'SubjectAssignment' },
      { model: Marks, name: 'Marks' },
      { model: CGPA, name: 'CGPA' },
      { model: AcademicStructure, name: 'AcademicStructure' },
      { model: FacultySubject, name: 'FacultySubject' }
    ];

    for (const { model, name } of models) {
      try {
        await model.sync({ force });
        console.log(`${name} model synchronized ${force ? '(with force)' : ''}`);
      } catch (error) {
        console.error(`Error syncing ${name} model:`, error);
        throw error;
      }
    }

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Handle process termination
const handleShutdown = async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Initialize database on startup
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = sequelize; 