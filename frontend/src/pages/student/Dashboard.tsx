import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Marks {
  id: string;
  continuousAssessment: {
    assignments: Array<{ title: string; obtainedMarks: number; maxMarks: number; }>;
    quizzes: Array<{ title: string; obtainedMarks: number; maxMarks: number; }>;
    classParticipation: number;
    total: number;
    maxMarks: number;
  };
  midterm: {
    obtainedMarks: number;
    maxMarks: number;
  };
  termWork: {
    practicals: Array<{ title: string; obtainedMarks: number; maxMarks: number; }>;
    projects: Array<{ title: string; obtainedMarks: number; maxMarks: number; }>;
    presentations: Array<{ title: string; obtainedMarks: number; maxMarks: number; }>;
    total: number;
    maxMarks: number;
  };
  theory: {
    obtainedMarks: number;
    maxMarks: number;
  };
  totalMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  SubjectAssignment: {
    subject: string;
    subjectCode: string;
    faculty: {
      name: string;
      email: string;
    };
    AcademicStructure: {
      year: number;
      semester: number;
      academicYear: string;
    };
  };
}

interface Performance {
  cgpa: number;
  semesterPerformance: {
    [key: string]: {
      year: number;
      semester: number;
      academicYear: string;
      totalCredits: number;
      totalGradePoints: number;
      gpa: number;
    };
  };
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentMarks, setCurrentMarks] = useState<Marks[]>([]);
  const [marksHistory, setMarksHistory] = useState<{ [key: string]: { year: number; semester: number; academicYear: string; subjects: Marks[]; } }>();
  const [performance, setPerformance] = useState<Performance>();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchCurrentMarks();
    fetchMarksHistory();
    fetchPerformance();
  }, []);

  const fetchCurrentMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/marks/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentMarks(response.data);
    } catch (error) {
      console.error('Error fetching current marks:', error);
    }
  };

  const fetchMarksHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/marks/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarksHistory(response.data);
    } catch (error) {
      console.error('Error fetching marks history:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/performance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const getPerformanceData = () => {
    if (!performance) return null;

    const semesters = Object.values(performance.semesterPerformance)
      .sort((a, b) => (a.year * 2 + a.semester) - (b.year * 2 + b.semester));

    return {
      labels: semesters.map(s => `Year ${s.year} - Sem ${s.semester}`),
      datasets: [
        {
          label: 'GPA',
          data: semesters.map(s => s.gpa),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Semester-wise Performance'
      }
    },
    scales: {
      y: {
        min: 0,
        max: 10
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Card sx={{ minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Typography variant="h3" color="primary" gutterBottom>
              {performance?.cgpa.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">
              CGPA
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Current Semester" />
            <Tab label="Previous Semesters" />
            <Tab label="Performance Analysis" />
          </Tabs>

          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Faculty</TableCell>
                    <TableCell>Continuous Assessment (30)</TableCell>
                    <TableCell>Midterm (20)</TableCell>
                    <TableCell>Term Work (25)</TableCell>
                    <TableCell>Theory (25)</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentMarks.map((mark) => (
                    <TableRow key={mark.id}>
                      <TableCell>
                        {mark.SubjectAssignment.subject}
                        <Typography variant="caption" display="block">
                          {mark.SubjectAssignment.subjectCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{mark.SubjectAssignment.faculty.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Assignments: {mark.continuousAssessment.assignments.reduce((sum, a) => sum + a.obtainedMarks, 0)}/
                          {mark.continuousAssessment.assignments.reduce((sum, a) => sum + a.maxMarks, 0)}
                        </Typography>
                        <Typography variant="body2">
                          Quizzes: {mark.continuousAssessment.quizzes.reduce((sum, q) => sum + q.obtainedMarks, 0)}/
                          {mark.continuousAssessment.quizzes.reduce((sum, q) => sum + q.maxMarks, 0)}
                        </Typography>
                        <Typography variant="body2">
                          Participation: {mark.continuousAssessment.classParticipation}/10
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Total: {mark.continuousAssessment.total}/30
                        </Typography>
                      </TableCell>
                      <TableCell>{mark.midterm.obtainedMarks}/{mark.midterm.maxMarks}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Practicals: {mark.termWork.practicals.reduce((sum, p) => sum + p.obtainedMarks, 0)}/
                          {mark.termWork.practicals.reduce((sum, p) => sum + p.maxMarks, 0)}
                        </Typography>
                        <Typography variant="body2">
                          Projects: {mark.termWork.projects.reduce((sum, p) => sum + p.obtainedMarks, 0)}/
                          {mark.termWork.projects.reduce((sum, p) => sum + p.maxMarks, 0)}
                        </Typography>
                        <Typography variant="body2">
                          Presentations: {mark.termWork.presentations.reduce((sum, p) => sum + p.obtainedMarks, 0)}/
                          {mark.termWork.presentations.reduce((sum, p) => sum + p.maxMarks, 0)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          Total: {mark.termWork.total}/25
                        </Typography>
                      </TableCell>
                      <TableCell>{mark.theory.obtainedMarks}/{mark.theory.maxMarks}</TableCell>
                      <TableCell>{mark.totalMarks}/{mark.continuousAssessment.maxMarks + mark.midterm.maxMarks + mark.termWork.maxMarks + mark.theory.maxMarks}</TableCell>
                      <TableCell>{mark.grade} ({mark.gradePoint})</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && marksHistory && (
            <Box>
              {Object.entries(marksHistory)
                .sort(([keyA], [keyB]) => {
                  const [yearA, semA] = keyA.split('-').map(Number);
                  const [yearB, semB] = keyB.split('-').map(Number);
                  return (yearB * 2 + semB) - (yearA * 2 + semA);
                })
                .map(([key, semester]) => (
                  <Accordion key={key}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        Year {semester.year} - Semester {semester.semester} ({semester.academicYear})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Subject</TableCell>
                              <TableCell>Faculty</TableCell>
                              <TableCell>Total Marks</TableCell>
                              <TableCell>Percentage</TableCell>
                              <TableCell>Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {semester.subjects.map((mark) => (
                              <TableRow key={mark.id}>
                                <TableCell>
                                  {mark.SubjectAssignment.subject}
                                  <Typography variant="caption" display="block">
                                    {mark.SubjectAssignment.subjectCode}
                                  </Typography>
                                </TableCell>
                                <TableCell>{mark.SubjectAssignment.faculty.name}</TableCell>
                                <TableCell>{mark.totalMarks}</TableCell>
                                <TableCell>{mark.percentage.toFixed(2)}%</TableCell>
                                <TableCell>{mark.grade} ({mark.gradePoint})</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
            </Box>
          )}

          {activeTab === 2 && performance && (
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Paper sx={{ p: 2 }}>
                  {getPerformanceData() && (
                    <Line options={options} data={getPerformanceData()!} />
                  )}
                </Paper>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Year</TableCell>
                        <TableCell>Semester</TableCell>
                        <TableCell>Academic Year</TableCell>
                        <TableCell>Credits</TableCell>
                        <TableCell>GPA</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(performance.semesterPerformance)
                        .sort(([keyA], [keyB]) => {
                          const [yearA, semA] = keyA.split('-').map(Number);
                          const [yearB, semB] = keyB.split('-').map(Number);
                          return (yearB * 2 + semB) - (yearA * 2 + semA);
                        })
                        .map(([key, sem]) => (
                          <TableRow key={key}>
                            <TableCell>{sem.year}</TableCell>
                            <TableCell>{sem.semester}</TableCell>
                            <TableCell>{sem.academicYear}</TableCell>
                            <TableCell>{sem.totalCredits}</TableCell>
                            <TableCell>{sem.gpa.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentDashboard; 