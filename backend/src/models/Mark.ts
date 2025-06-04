import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes } from './interfaces/BaseModel';
import { Subject } from './Subject';
import { Student } from './Student';

export interface MarkAttributes extends BaseAttributes {
  subjectId: number;
  studentId: number;
  assessmentType: 'Assignment' | 'CA' | 'Midterm' | 'Term Work' | 'Theory';
  value: number;
  isActive: boolean;
}

export type MarkCreationAttributes = Optional<MarkAttributes, keyof BaseAttributes | 'isActive'>;

export class Mark extends Model<MarkAttributes, MarkCreationAttributes> implements MarkAttributes {
  public id!: number;
  public subjectId!: number;
  public studentId!: number;
  public assessmentType!: 'Assignment' | 'CA' | 'Midterm' | 'Term Work' | 'Theory';
  public value!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Add association methods
  public getSubject!: () => Promise<Subject>;
  public setSubject!: (subject: Subject) => Promise<void>;
  public getStudent!: () => Promise<Student>;
  public setStudent!: (student: Student) => Promise<void>;
}

Mark.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    },
    assessmentType: {
      type: DataTypes.ENUM('Assignment', 'CA', 'Midterm', 'Term Work', 'Theory'),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
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
    tableName: 'marks',
    indexes: [
      {
        unique: true,
        fields: ['subjectId', 'studentId', 'assessmentType'],
      },
    ],
  }
);

// Define associations
Mark.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

Mark.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

export default Mark; 