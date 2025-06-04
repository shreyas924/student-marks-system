import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../../api/axios';

interface Student {
  id: string;
  name: string;
  studentId: string;
  currentMarks?: number;
}

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  year: number;
  semester: number;
  branch: string;
}

interface ManageMarksProps {}

const ManageMarks: React.FC<ManageMarksProps> = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksEntries, setMarksEntries] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch subject details
      const subjectResponse = await api.get(`/subjects/${subjectId}`);
      setSubject(subjectResponse.data);

      // Fetch students in the same year, semester, and branch
      const studentsResponse = await api.get('/users/students', {
        params: {
          year: subjectResponse.data.year,
          semester: subjectResponse.data.semester,
          branch: subjectResponse.data.branch
        }
      });

      // Fetch existing marks
      const marksResponse = await api.get(`/marks/${subjectId}`);
      const marksMap = new Map(marksResponse.data.map((mark: any) => [mark.studentId, mark.marks]));

      // Combine student data with their marks
      const studentsWithMarks = studentsResponse.data.map((student: any) => ({
        ...student,
        currentMarks: marksMap.get(student.id)
      }));

      setStudents(studentsWithMarks);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    // Clear success message when user starts editing
    setSuccess('');
    
    // Validate input
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      return;
    }

    setMarksEntries(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const entries = Object.entries(marksEntries)
        .filter(([_, value]) => value !== '')
        .map(([studentId, marks]) => ({
          studentId,
          marks: Number(marks)
        }));

      if (entries.length === 0) {
        setError('No marks to update');
        return;
      }

      await api.post(`/marks/${subjectId}`, { entries });
      setSuccess('Marks updated successfully');
      
      // Refresh data to show updated marks
      await fetchData();
      
      // Clear entries after successful save
      setMarksEntries({});
    } catch (err: any) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!subject) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Subject not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Manage Marks: {subject.subjectName}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle1">Subject Code: {subject.subjectCode}</Typography>
        <Typography variant="subtitle1">
          Year: {subject.year} | Semester: {subject.semester} | Branch: {subject.branch}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Current Marks</TableCell>
              <TableCell>New Marks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.studentId}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  {student.currentMarks !== undefined ? student.currentMarks : 'Not set'}
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={marksEntries[student.id] || ''}
                    onChange={(e) => handleMarksChange(student.id, e.target.value)}
                    inputProps={{ min: 0, max: 100 }}
                    error={
                      marksEntries[student.id] !== undefined &&
                      marksEntries[student.id] !== '' &&
                      (isNaN(Number(marksEntries[student.id])) ||
                        Number(marksEntries[student.id]) < 0 ||
                        Number(marksEntries[student.id]) > 100)
                    }
                    helperText={
                      marksEntries[student.id] !== undefined &&
                      marksEntries[student.id] !== '' &&
                      (isNaN(Number(marksEntries[student.id])) ||
                        Number(marksEntries[student.id]) < 0 ||
                        Number(marksEntries[student.id]) > 100)
                        ? 'Marks must be between 0 and 100'
                        : ''
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || Object.keys(marksEntries).length === 0}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Marks'}
        </Button>
      </Box>
    </Container>
  );
};

export default ManageMarks; 