import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes } from './interfaces/BaseModel';
import { User } from './User';

export interface StudentAttributes extends BaseAttributes {
  userId: number;
  studentId: string;
  department: string;
  branch: string;
  currentYear: number;
  currentSemester: number;
  academicYear: string;
}

export type StudentCreationAttributes = Optional<StudentAttributes, keyof BaseAttributes>;

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: number;
  public userId!: number;
  public studentId!: string;
  public department!: string;
  public branch!: string;
  public currentYear!: number;
  public currentSemester!: number;
  public academicYear!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{2}[A-Z]{2}\d{3}$/,
      },
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    currentSemester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\d{4}-\d{4}$/,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'students',
  }
);

// Define associations
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });

export default Student; 