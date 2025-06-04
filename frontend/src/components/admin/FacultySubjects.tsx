import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../api/axios';

interface SubjectAssignment {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  year: number;
  semester: number;
  branch: string;
  assignedFaculty: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    facultyProfile: {
      facultyId: string;
      department: string;
    };
  }[];
}

export interface FacultySubjectsRef {
  fetchAssignments: () => Promise<void>;
}

const FacultySubjects = forwardRef<FacultySubjectsRef>((props, ref) => {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/subjects/assignments');
      
      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        setAssignments(response.data.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch subject assignments';
      setError(errorMessage);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useImperativeHandle(ref, () => ({
    fetchAssignments
  }));

  const handleToggleStatus = async (id: string) => {
    try {
      setError('');
      await api.patch(`/admin/subject-assignments/${id}/toggle-status`);
      await fetchAssignments();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Faculty Subject Assignments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : assignments.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No subject assignments found
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Faculty Name</TableCell>
                <TableCell>Faculty ID</TableCell>
                <TableCell>Subject Name</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.assignedFaculty[0]?.firstName} {assignment.assignedFaculty[0]?.lastName}
                  </TableCell>
                  <TableCell>{assignment.assignedFaculty[0]?.facultyProfile.facultyId}</TableCell>
                  <TableCell>{assignment.name}</TableCell>
                  <TableCell>{assignment.code}</TableCell>
                  <TableCell>{assignment.year}</TableCell>
                  <TableCell>{assignment.semester}</TableCell>
                  <TableCell>{assignment.branch}</TableCell>
                  <TableCell>
                    <Typography
                      color={assignment.isActive ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {assignment.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={assignment.isActive ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(assignment.id)}
                      size="small"
                    >
                      {assignment.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
});

FacultySubjects.displayName = 'FacultySubjects';

export default FacultySubjects; 