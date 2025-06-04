import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../api/axios';

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  year: number;
  semester: number;
  branch: string;
}

interface Mark {
  id?: string;
  studentId: string;
  subjectId: string;
  assessmentType: string;
  marks: number;
}

const assessmentTypes = ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory'];

const MarksEntry: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [assessmentType, setAssessmentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubjectAndStudents();
  }, [subjectId]);

  useEffect(() => {
    if (subject && assessmentType) {
      fetchExistingMarks();
    }
  }, [subject, assessmentType]);

  const fetchSubjectAndStudents = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch subject details
      const subjectResponse = await api.get(`/subjects/${subjectId}`);
      setSubject(subjectResponse.data);

      // Fetch students based on year, semester, and branch
      const studentsResponse = await api.get('/users/students/filter', {
        params: {
          year: subjectResponse.data.year,
          semester: subjectResponse.data.semester,
          branch: subjectResponse.data.branch
        }
      });
      setStudents(studentsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch subject and students data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMarks = async () => {
    try {
      const response = await api.get(`/marks/${subjectId}/${assessmentType}`);
      const marksMap: Record<string, Mark> = {};
      response.data.forEach((mark: Mark) => {
        marksMap[mark.studentId] = mark;
      });
      setMarks(marksMap);
    } catch (error) {
      console.error('Error fetching marks:', error);
      setError('Failed to fetch existing marks');
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;

    setMarks(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        subjectId: subjectId!,
        assessmentType,
        marks: numValue,
        ...(prev[studentId]?.id ? { id: prev[studentId].id } : {})
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const marksArray = Object.values(marks);
      await api.post('/marks/bulk', { marks: marksArray });

      setSuccess('Marks saved successfully!');
    } catch (error) {
      console.error('Error saving marks:', error);
      setError('Failed to save marks');
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Subject not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marks Entry
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        {subject.subjectName} ({subject.subjectCode})
      </Typography>
      
      <Typography color="textSecondary" gutterBottom>
        Year: {subject.year} | Semester: {subject.semester} | Branch: {subject.branch}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
        <InputLabel>Assessment Type</InputLabel>
        <Select
          value={assessmentType}
          label="Assessment Type"
          onChange={(e) => setAssessmentType(e.target.value)}
        >
          {assessmentTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {assessmentType && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Marks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={marks[student.id]?.marks || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        inputProps={{ min: 0, max: 100 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Marks'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MarksEntry; 