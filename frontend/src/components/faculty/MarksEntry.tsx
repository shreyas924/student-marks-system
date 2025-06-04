import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

interface Student {
  id: number;
  rollNo: string;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  year: number;
  semester: number;
  branch: string;
}

const assessmentTypes = [
  'Assignment',
  'CA',
  'Midterm',
  'Term Work',
  'Theory'
] as const;

type AssessmentType = typeof assessmentTypes[number];

interface StudentMark {
  studentId: number;
  value: string;
}

const MarksEntry: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessmentType, setAssessmentType] = useState<AssessmentType | ''>('');
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubjectAndStudents();
  }, [subjectId]);

  const fetchSubjectAndStudents = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch subject details
      const subjectResponse = await api.get(`/subjects/${subjectId}`);
      if (subjectResponse.data?.status === 'success') {
        setSubject(subjectResponse.data.data);
      }

      // Fetch eligible students
      const studentsResponse = await api.get(`/subjects/students/${subjectId}`);
      if (studentsResponse.data?.status === 'success') {
        setStudents(studentsResponse.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: number, value: string) => {
    // Validate input is a number between 0 and 100
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setMarks(prev => ({
        ...prev,
        [studentId]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Format marks data
      const marksData = Object.entries(marks)
        .filter(([_, value]) => value !== '')
        .map(([studentId, value]) => ({
          studentId: parseInt(studentId),
          value: parseFloat(value)
        }));

      if (marksData.length === 0) {
        throw new Error('Please enter at least one mark');
      }

      await api.post(`/subjects/marks/${subjectId}`, {
        assessmentType,
        marks: marksData
      });

      setSuccess('Marks saved successfully!');
      // Clear marks after successful save
      setMarks({});
      setAssessmentType('');
    } catch (error: any) {
      console.error('Error saving marks:', error);
      setError(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!subject) {
    return (
      <Alert severity="error">
        Subject not found or you don't have access to it.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Enter Marks - {subject.name} ({subject.code})
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        {subject.year} Year | Semester {subject.semester} | {subject.branch}
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

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Assessment Type</InputLabel>
        <Select
          value={assessmentType}
          label="Assessment Type"
          onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
          disabled={saving}
        >
          {assessmentTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {students.length === 0 ? (
        <Alert severity="info">
          No eligible students found for this subject.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Marks (0-100)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={marks[student.id] || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        inputProps={{
                          min: 0,
                          max: 100,
                          step: 0.5
                        }}
                        size="small"
                        disabled={saving}
                        sx={{ width: '100px' }}
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
              onClick={handleSubmit}
              disabled={saving || !assessmentType}
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