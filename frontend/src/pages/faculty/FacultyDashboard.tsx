import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  year: number;
  semester: number;
  branch: string;
}

const FacultyDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    try {
      const response = await api.get(`/subjects/faculty/${user?.id}`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch assigned subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/faculty/marks-entry/${subjectId}`);
  };

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
        My Assigned Subjects
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6
                }
              }}
              onClick={() => handleSubjectClick(subject.id)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {subject.subjectName}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Code: {subject.subjectCode}
                </Typography>
                <Typography color="textSecondary">
                  Year: {subject.year}
                </Typography>
                <Typography color="textSecondary">
                  Semester: {subject.semester}
                </Typography>
                <Typography color="textSecondary">
                  Branch: {subject.branch}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubjectClick(subject.id);
                  }}
                >
                  Enter Marks
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {subjects.length === 0 && !error && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="textSecondary">
            No subjects assigned yet
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FacultyDashboard; 