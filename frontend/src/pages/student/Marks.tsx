import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Alert,
  Stack,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Grid2 from '@mui/material/Unstable_Grid2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface SubjectMarks {
  id: string;
  subject: string;
  subjectCode: string;
  assignmentMarks: number | null;
  midtermMarks: number | null;
  theoryMarks: number | null;
  practicalMarks: number | null;
  totalMarks: number;
  grade: string;
}

interface CGPA {
  semester: number;
  academicYear: string;
  gpa: number;
  cgpa: number;
  totalCredits: number;
  earnedCredits: number;
}

const Marks: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [marks, setMarks] = useState<SubjectMarks[]>([]);
  const [cgpa, setCGPA] = useState<CGPA | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
    fetchCGPA();
  }, []);

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/student/marks',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMarks(response.data);
    } catch (error) {
      console.error('Error fetching marks:', error);
      setError('Failed to fetch marks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCGPA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/student/cgpa',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCGPA(response.data);
    } catch (error) {
      console.error('Error fetching CGPA:', error);
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return theme.palette.success.main;
    if (value >= 70) return theme.palette.info.main;
    if (value >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getChartData = () => {
    return marks.map(mark => ({
      subject: mark.subjectCode,
      Assignment: mark.assignmentMarks || 0,
      Midterm: mark.midtermMarks || 0,
      Theory: mark.theoryMarks || 0,
      Practical: mark.practicalMarks || 0,
      Total: mark.totalMarks
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Academic Performance</Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cgpa && (
          <Box sx={{ flexGrow: 1 }}>
            <Grid2 container spacing={2}>
              <Grid2 xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Current CGPA
                    </Typography>
                    <Typography variant="h3" component="div">
                      {cgpa.cgpa.toFixed(2)}
                    </Typography>
                    <Typography color="textSecondary">
                      Semester {cgpa.semester} • {cgpa.academicYear}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid2>
              <Grid2 xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Current GPA
                    </Typography>
                    <Typography variant="h3" component="div">
                      {cgpa.gpa.toFixed(2)}
                    </Typography>
                    <Typography color="textSecondary">
                      Credits Earned: {cgpa.earnedCredits}/{cgpa.totalCredits}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          </Box>
        )}

        <Box sx={{ height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Performance Analysis
          </Typography>
          <ResponsiveContainer>
            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Assignment" fill="#8884d8" />
              <Bar dataKey="Midterm" fill="#82ca9d" />
              <Bar dataKey="Theory" fill="#ffc658" />
              <Bar dataKey="Practical" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Typography variant="h6">Detailed Marks</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Assignment (20%)</TableCell>
                <TableCell>Mid-term (30%)</TableCell>
                <TableCell>Theory (40%)</TableCell>
                <TableCell>Practical (10%)</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marks.map((mark) => (
                <TableRow key={mark.id}>
                  <TableCell>{mark.subject}</TableCell>
                  <TableCell>{mark.subjectCode}</TableCell>
                  <TableCell>{mark.assignmentMarks || '-'}</TableCell>
                  <TableCell>{mark.midtermMarks || '-'}</TableCell>
                  <TableCell>{mark.theoryMarks || '-'}</TableCell>
                  <TableCell>{mark.practicalMarks || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={mark.totalMarks}
                        sx={{
                          color: getProgressColor(mark.totalMarks)
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" component="div" color="text.secondary">
                          {mark.totalMarks.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{mark.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
};

export default Marks; 