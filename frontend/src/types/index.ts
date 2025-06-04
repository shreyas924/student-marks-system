export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  department: string;
  studentId?: string;
  facultyId?: string;
  class?: string;
}

export interface MarksEntry {
  type: string;
  title: string;
  maxMarks: number;
  obtainedMarks: number;
}

export interface Marks {
  id: string;
  student: User;
  faculty: User;
  subject: string;
  academicYear: string;
  semester: number;
  assignmentMarks: MarksEntry[];
  continuousAssessmentMarks: MarksEntry[];
  midtermMarks: MarksEntry;
  termWorkMarks: MarksEntry;
  endSemesterMarks: MarksEntry;
  totalMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
} 