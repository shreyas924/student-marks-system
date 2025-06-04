import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Subject {
  id: string;
  subject: string;  // This matches the database field
  subjectCode: string;  // This matches the database field
  isActive: boolean;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface MarkEntry {
  studentId: string;
  marks: number;
  type: string;
  maxMarks: number;
}

const markTypes = [
  { value: 'termwork', label: 'Term Work', maxMarks: 25 },
  { value: 'continuous_assessment', label: 'Continuous Assessment', maxMarks: 20 },
  { value: 'practical', label: 'Practical', maxMarks: 25 },
  { value: 'midterm', label: 'Mid-term', maxMarks: 30 },
  { value: 'theory', label: 'Theory', maxMarks: 100 }
];

const SubjectsList: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [markType, setMarkType] = useState('');
  const [markEntries, setMarkEntries] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/faculty/subjects',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Fetched subjects:', response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/users/role/student',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    setOpenDialog(true);
    await fetchStudents();
    setMarkType('');
    setMarkEntries({});
  };

  const handleMarkTypeChange = (event: any) => {
    setMarkType(event.target.value);
    setMarkEntries({});
  };

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = Number(value);
    const maxMarks = markTypes.find(type => type.value === markType)?.maxMarks || 0;
    
    if (numValue >= 0 && numValue <= maxMarks) {
      setMarkEntries(prev => ({
        ...prev,
        [studentId]: numValue
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !markType) return;

    try {
      const token = localStorage.getItem('token');
      const entries: MarkEntry[] = Object.entries(markEntries).map(([studentId, marks]) => ({
        studentId,
        marks,
        type: markType,
        maxMarks: markTypes.find(type => type.value === markType)?.maxMarks || 0
      }));

      await axios.post(
        'http://localhost:5000/api/marks/bulk',
        {
          subjectId: selectedSubject.id,
          entries
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOpenDialog(false);
      setSelectedSubject(null);
      setMarkType('');
      setMarkEntries({});
    } catch (error) {
      console.error('Error submitting marks:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Assigned Subjects
      </Typography>
      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
                height: '100%'
              }}
              onClick={() => handleSubjectClick(subject)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {subject.subject}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Subject Code: {subject.subjectCode}
                </Typography>
                <Typography color="textSecondary">
                  Status: {subject.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSubject?.subject} ({selectedSubject?.subjectCode}) - Enter Marks
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Mark Type</InputLabel>
              <Select
                value={markType}
                onChange={handleMarkTypeChange}
                label="Mark Type"
              >
                {markTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} (Max: {type.maxMarks})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {markType && (
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
                          value={markEntries[student.id] || ''}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          inputProps={{
                            min: 0,
                            max: markTypes.find(type => type.value === markType)?.maxMarks
                          }}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!markType || Object.keys(markEntries).length === 0}
          >
            Submit Marks
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectsList; 