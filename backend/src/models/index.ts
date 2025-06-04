import User from './User';
import Faculty from './Faculty';
import Subject from './Subject';
import Marks from './Marks';

// Define additional associations here if needed
// (Most associations are already defined in individual model files)

// Define associations
User.hasOne(Faculty, {
  foreignKey: 'userId',
  as: 'facultyProfile',
});

Faculty.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  User,
  Faculty,
  Subject,
  Marks,
};

// Export types
export type { UserAttributes, UserCreationAttributes } from './User';
export type { SubjectAttributes, SubjectCreationAttributes } from './Subject';
export type { MarksAttributes, MarksCreationAttributes } from './Marks';

export { default as Student } from './Student';
export { default as Faculty } from './Faculty'; 