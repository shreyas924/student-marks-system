"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = void 0;
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
const pg_connection_string_1 = require("pg-connection-string");
// Load environment variables
dotenv_1.default.config();
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
// Parse the connection string
const connectionConfig = (0, pg_connection_string_1.parse)(DATABASE_URL);
const sequelizeConfig = {
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
    logging: (msg) => logger_1.logger.debug(msg),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};
const sequelize = new sequelize_1.Sequelize(DATABASE_URL, sequelizeConfig);
const setupDatabase = async () => {
    try {
        await sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        const force = process.env.FORCE_SYNC === 'true';
        await sequelize.sync({ force });
        logger_1.logger.info(`Database models synchronized ${force ? '(with force)' : ''}`);
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.setupDatabase = setupDatabase;
exports.default = sequelize;
