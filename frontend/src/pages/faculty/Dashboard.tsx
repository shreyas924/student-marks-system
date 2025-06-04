import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import SubjectCard from '../../components/faculty/SubjectCard';
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
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get(`/subjects/faculty/${user?.id}`);
        setSubjects(response.data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load assigned subjects');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchSubjects();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Faculty Dashboard
      </Typography>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
        Your Assigned Subjects
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {subjects.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              No subjects have been assigned to you yet.
            </Alert>
          </Grid>
        ) : (
          subjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} key={subject.id}>
              <SubjectCard subject={subject} />
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default FacultyDashboard; 