import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Subject {
  id: number;
  name: string;
  code: string;
  year: number;
  semester: number;
  branch: string;
}

const SubjectsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/subjects/faculty-subjects');
      
      if (response.data?.status === 'success') {
        setSubjects(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      setError(error.response?.data?.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: number) => {
    navigate(`/marks-entry/${subjectId}`);
  };

  const getYearDisplay = (year: number) => {
    const yearMap: Record<number, string> = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year'
    };
    return yearMap[year] || `Year ${year}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Assigned Subjects
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {subjects.length === 0 ? (
        <Alert severity="info">
          No subjects have been assigned to you yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {subjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} key={subject.id}>
              <Card>
                <CardActionArea onClick={() => handleSubjectClick(subject.id)}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {subject.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Code: {subject.code}
                    </Typography>
                    <Typography color="text.secondary">
                      {getYearDisplay(subject.year)} | Semester {subject.semester}
                    </Typography>
                    <Typography color="text.secondary">
                      Branch: {subject.branch}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SubjectsList; 