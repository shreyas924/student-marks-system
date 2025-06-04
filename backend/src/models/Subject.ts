import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes } from './interfaces/BaseModel';
import { User } from './User';

export interface SubjectAttributes extends BaseAttributes {
  code: string;
  name: string;
  description?: string;
  credits?: number;
  year: number;
  semester: number;
  branch: string;
  facultyId: number;
  isActive: boolean;
}

export type SubjectCreationAttributes = Optional<SubjectAttributes, keyof BaseAttributes | 'description' | 'credits' | 'isActive'>;

export class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public description!: string;
  public credits!: number;
  public year!: number;
  public semester!: number;
  public branch!: string;
  public facultyId!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Add association methods
  public getFaculty!: () => Promise<User>;
  public setFaculty!: (faculty: User) => Promise<void>;
}

Subject.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'subjects',
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
    ],
  }
);

// Define associations
Subject.belongsTo(User, {
  as: 'faculty',
  foreignKey: 'facultyId',
});

export default Subject; 