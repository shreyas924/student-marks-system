import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const FacultyAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: '',
    subjectId: '',
    academicYear: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, facultyRes, subjectsRes] = await Promise.all([
        axios.get('/api/admin/faculty-assignments'),
        axios.get('/api/admin/faculty'),
        axios.get('/api/admin/subjects')
      ]);
      setAssignments(assignmentsRes.data);
      setFaculty(facultyRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleOpen = (assignment = null) => {
    if (assignment) {
      setFormData({
        facultyId: assignment.facultyId,
        subjectId: assignment.subjectId,
        academicYear: assignment.academicYear
      });
      setEditMode(true);
    } else {
      setFormData({
        facultyId: '',
        subjectId: '',
        academicYear: new Date().getFullYear().toString()
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setFormData({
      facultyId: '',
      subjectId: '',
      academicYear: new Date().getFullYear().toString()
    });
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await axios.put(`/api/admin/faculty-assignments/${formData.id}`, formData);
      } else {
        await axios.post('/api/admin/faculty-assignments', formData);
      }
      fetchData();
      handleClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`/api/admin/faculty-assignments/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Faculty Subject Assignments
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add New Assignment
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Faculty Name</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => {
              const subject = subjects.find(s => s.id === assignment.subjectId);
              const facultyMember = faculty.find(f => f.id === assignment.facultyId);
              return (
                <TableRow key={assignment.id}>
                  <TableCell>{facultyMember?.name || 'N/A'}</TableCell>
                  <TableCell>{subject?.name || 'N/A'}</TableCell>
                  <TableCell>{subject?.year || 'N/A'}</TableCell>
                  <TableCell>{subject?.semester || 'N/A'}</TableCell>
                  <TableCell>{subject?.branch || 'N/A'}</TableCell>
                  <TableCell>{assignment.academicYear}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(assignment)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(assignment.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Faculty Assignment' : 'Add New Faculty Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Faculty</InputLabel>
                  <Select
                    value={formData.facultyId}
                    label="Faculty"
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  >
                    {faculty.map(f => (
                      <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subjectId}
                    label="Subject"
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  >
                    {subjects.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {`${subject.name} (${subject.code}) - Year ${subject.year}, Sem ${subject.semester}, ${subject.branch}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyAssignment; 