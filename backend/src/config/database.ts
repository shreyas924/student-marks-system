import { Sequelize, Options } from 'sequelize';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

// Load environment variables
dotenv.config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Parse the connection string
const connectionConfig = parse(DATABASE_URL);

const sequelizeConfig: Options = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  host: connectionConfig.host || 'localhost',
  port: connectionConfig.port ? parseInt(connectionConfig.port) : 5432,
  database: connectionConfig.database || 'neondb',
  username: connectionConfig.user,
  password: connectionConfig.password,
  logging: (msg: string) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = new Sequelize(DATABASE_URL, sequelizeConfig);

export const setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    const force = process.env.FORCE_SYNC === 'true';
    await sequelize.sync({ force });
    logger.info(`Database models synchronized ${force ? '(with force)' : ''}`);
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize; 