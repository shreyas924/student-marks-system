import React, { useState, useEffect } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Box,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { User, MarksEntry } from '../../types';

interface Student extends User {
  id: string;
}

interface MarksEntryForm {
  type: string;
  title: string;
  maxMarks: number;
  obtainedMarks: number;
}

const MarksManagement: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [marksEntry, setMarksEntry] = useState<MarksEntryForm>({
    type: '',
    title: '',
    maxMarks: 0,
    obtainedMarks: 0
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/department/${user?.department}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleOpen = (student: Student) => {
    setSelectedStudent(student);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStudent(null);
    setMarksEntry({
      type: '',
      title: '',
      maxMarks: 0,
      obtainedMarks: 0
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/marks',
        {
          student: selectedStudent?.id,
          subject: user?.department,
          marks: {
            [marksEntry.type]: marksEntry.type === 'assignments' || marksEntry.type === 'continuousAssessment'
              ? [{
                  title: marksEntry.title,
                  maxMarks: marksEntry.maxMarks,
                  obtainedMarks: marksEntry.obtainedMarks,
                  date: new Date()
                }]
              : {
                  maxMarks: marksEntry.maxMarks,
                  obtainedMarks: marksEntry.obtainedMarks,
                  date: new Date()
                }
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      handleClose();
    } catch (error) {
      console.error('Error submitting marks:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Marks Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.studentId}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen(student)}
                  >
                    Add Marks
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Marks for {selectedStudent?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <Select
                fullWidth
                value={marksEntry.type}
                label="Type"
                onChange={(e: SelectChangeEvent<string>) => 
                  setMarksEntry({ ...marksEntry, type: e.target.value })}
              >
                <MenuItem value="assignments">Assignment</MenuItem>
                <MenuItem value="continuousAssessment">Continuous Assessment</MenuItem>
                <MenuItem value="midterm">Midterm</MenuItem>
                <MenuItem value="termWork">Term Work</MenuItem>
                <MenuItem value="endSemester">End Semester</MenuItem>
              </Select>
              {(marksEntry.type === 'assignments' || marksEntry.type === 'continuousAssessment') && (
                <TextField
                  fullWidth
                  label="Title"
                  margin="normal"
                  value={marksEntry.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setMarksEntry({ ...marksEntry, title: e.target.value })}
                />
              )}
              <TextField
                fullWidth
                label="Maximum Marks"
                type="number"
                margin="normal"
                value={marksEntry.maxMarks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setMarksEntry({ ...marksEntry, maxMarks: Number(e.target.value) })}
              />
              <TextField
                fullWidth
                label="Obtained Marks"
                type="number"
                margin="normal"
                value={marksEntry.obtainedMarks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setMarksEntry({ ...marksEntry, obtainedMarks: Number(e.target.value) })}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MarksManagement; 