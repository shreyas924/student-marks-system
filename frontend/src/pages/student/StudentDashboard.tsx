import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';

interface Mark {
  id: string;
  marks: number;
  assessmentType: string;
  subject: {
    id: string;
    subjectName: string;
    subjectCode: string;
    year: number;
    semester: number;
    branch: string;
  };
}

const StudentDashboard: React.FC = () => {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const response = await api.get(`/marks/student/${user?.id}`);
      setMarks(response.data);
    } catch (error) {
      console.error('Error fetching marks:', error);
      setError('Failed to fetch marks');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (subjectMarks: Mark[]) => {
    if (subjectMarks.length === 0) return 0;
    const sum = subjectMarks.reduce((acc, mark) => acc + mark.marks, 0);
    return (sum / subjectMarks.length).toFixed(2);
  };

  // Group marks by subject
  const marksBySubject: { [key: string]: Mark[] } = {};
  marks.forEach(mark => {
    if (!marksBySubject[mark.subject.id]) {
      marksBySubject[mark.subject.id] = [];
    }
    marksBySubject[mark.subject.id].push(mark);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Academic Performance
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Semester
              </Typography>
              <Typography variant="h4">
                {user?.currentSemester || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Branch
              </Typography>
              <Typography variant="h4">
                {user?.branch || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Average
              </Typography>
              <Typography variant="h4">
                {marks.length > 0
                  ? calculateAverage(marks)
                  : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Subject-wise Performance
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell>CA</TableCell>
              <TableCell>Midterm</TableCell>
              <TableCell>Term Work</TableCell>
              <TableCell>Theory</TableCell>
              <TableCell>Average</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(marksBySubject).map((subjectMarks) => {
              const subject = subjectMarks[0].subject;
              const marksByType: { [key: string]: number } = {};
              subjectMarks.forEach(mark => {
                marksByType[mark.assessmentType] = mark.marks;
              });

              return (
                <TableRow key={subject.id}>
                  <TableCell>{subject.subjectName}</TableCell>
                  <TableCell>{subject.subjectCode}</TableCell>
                  <TableCell>{marksByType['Assignment'] || '-'}</TableCell>
                  <TableCell>{marksByType['CA'] || '-'}</TableCell>
                  <TableCell>{marksByType['Midterm'] || '-'}</TableCell>
                  <TableCell>{marksByType['Term Work'] || '-'}</TableCell>
                  <TableCell>{marksByType['Theory'] || '-'}</TableCell>
                  <TableCell>{calculateAverage(subjectMarks)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {Object.keys(marksBySubject).length === 0 && !error && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No marks available yet
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StudentDashboard; 