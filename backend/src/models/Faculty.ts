import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes } from './interfaces/BaseModel';
import { User } from './User';

export interface FacultyAttributes extends BaseAttributes {
  userId: number;
  facultyId: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FacultyCreationAttributes extends Optional<FacultyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Faculty extends Model<FacultyAttributes, FacultyCreationAttributes> implements FacultyAttributes {
  public id!: number;
  public userId!: number;
  public facultyId!: string;
  public department!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add association
  public readonly user?: User;
}

Faculty.init(
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
    facultyId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^FAC-\d{4}-\d{4}$/,
      },
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: 'faculty',
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['facultyId'],
      },
    ],
  }
);

export default Faculty; 