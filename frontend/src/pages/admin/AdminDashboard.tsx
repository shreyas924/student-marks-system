import React, { useState, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AssignSubjectForm from '../../components/admin/AssignSubjectForm';
import FacultySubjects, { FacultySubjectsRef } from '../../components/admin/FacultySubjects';

const AdminDashboard: React.FC = () => {
  const [openAssignSubject, setOpenAssignSubject] = useState(false);
  const facultySubjectsRef = useRef<FacultySubjectsRef>(null);

  const handleOpenAssignSubject = () => {
    setOpenAssignSubject(true);
  };

  const handleCloseAssignSubject = () => {
    setOpenAssignSubject(false);
  };

  const handleAssignmentSuccess = async () => {
    // Close the dialog
    handleCloseAssignSubject();
    // Refresh the faculty subjects list
    if (facultySubjectsRef.current) {
      await facultySubjectsRef.current.fetchAssignments();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenAssignSubject}
        >
          Assign Subject
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Students
              </Typography>
              {/* Add student count here */}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Faculty
              </Typography>
              {/* Add faculty count here */}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Subjects
              </Typography>
              {/* Add subjects count here */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Faculty Subjects Table */}
      <FacultySubjects ref={facultySubjectsRef} />

      {/* Assign Subject Dialog */}
      <Dialog
        open={openAssignSubject}
        onClose={handleCloseAssignSubject}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Assign Subject to Faculty</Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseAssignSubject}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <AssignSubjectForm onSuccess={handleAssignmentSuccess} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 