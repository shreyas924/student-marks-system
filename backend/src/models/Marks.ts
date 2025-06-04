import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { BaseAttributes } from './interfaces/BaseModel';
import { User } from './User';
import { Subject } from './Subject';

export interface MarksAttributes extends BaseAttributes {
  studentId: number;
  subjectId: number;
  marksValue: number;
  grade?: string;
  remarks?: string;
}

export type MarksCreationAttributes = Optional<MarksAttributes, keyof BaseAttributes | 'grade' | 'remarks'>;

export class Marks extends Model<MarksAttributes, MarksCreationAttributes> implements MarksAttributes {
  public id!: number;
  public studentId!: number;
  public subjectId!: number;
  public marksValue!: number;
  public grade?: string;
  public remarks?: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Add association methods
  public getStudent!: () => Promise<User>;
  public getSubject!: () => Promise<Subject>;
}

Marks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
    marksValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
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
        fields: ['studentId', 'subjectId'],
      },
    ],
    hooks: {
      beforeSave: (marks: Marks) => {
        // Calculate grade based on marks
        const marksValue = marks.marksValue;
        let grade = '';

        if (marksValue >= 90) grade = 'A+';
        else if (marksValue >= 80) grade = 'A';
        else if (marksValue >= 70) grade = 'B';
        else if (marksValue >= 60) grade = 'C';
        else if (marksValue >= 50) grade = 'D';
        else grade = 'F';

        marks.grade = grade;
      },
    },
  }
);

// Define associations
Marks.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

Marks.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});

export default Marks; 