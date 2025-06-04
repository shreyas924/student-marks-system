import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Container,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon
} from '@mui/icons-material';
import SubjectManagement from '../../components/admin/SubjectManagement';
import FacultyAssignment from '../../components/admin/FacultyAssignment';
import AssignSubjectModal from '../../components/admin/AssignSubjectModal';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedComponent, setSelectedComponent] = useState<string>('dashboard');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'subjects':
        return <SubjectManagement />;
      case 'faculty-assignments':
        return <FacultyAssignment />;
      default:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardActionArea onClick={() => setSelectedComponent('subjects')}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <BookIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Manage Subjects</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add, edit, and manage course subjects
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardActionArea onClick={() => setSelectedComponent('faculty-assignments')}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AssignmentIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Faculty Assignments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assign subjects to faculty members
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardActionArea onClick={() => navigate('/departments')}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <SchoolIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Departments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage academic departments
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardActionArea onClick={() => navigate('/users')}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <PersonIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Users</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage faculty and student accounts
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardActionArea onClick={() => navigate('/reports')}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <AssessmentIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Reports</Typography>
                    <Typography variant="body2" color="text.secondary">
                      View academic performance reports
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        );
    }
  };

  const handleAssignSuccess = () => {
    // You can add a notification or refresh data here
    console.log('Subject assigned successfully');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                  Admin Dashboard
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  Assign Subject
                </Button>
              </Box>
            </Grid>
            {selectedComponent === 'dashboard' ? (
              <>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  Welcome to the admin dashboard. Select a module to manage.
                </Typography>
              </>
            ) : (
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => setSelectedComponent('dashboard')}
                  >
                    ← Back to Dashboard
                  </Typography>
                </Box>
              </Grid>
            )}
            {renderComponent()}
          </Grid>
        </Paper>
      </Container>
      <AssignSubjectModal
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={handleAssignSuccess}
      />
    </Box>
  );
};

export default AdminDashboard; 