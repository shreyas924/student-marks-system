import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    studentId: '',
    facultyId: '',
    branch: '',
    currentYear: '',
    currentSemester: '',
    academicYear: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && {
        department: '',
        studentId: '',
        facultyId: '',
        branch: '',
        currentYear: '',
        currentSemester: '',
        academicYear: ''
      })
    }));
    setError('');
  };

  const generateFacultyId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `FAC-${year}-${randomNum}`;
  };

  const validateForm = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'role'];
    if (formData.role === 'student') {
      requiredFields.push('studentId', 'department', 'branch', 'currentYear', 'currentSemester', 'academicYear');
    }
    if (formData.role === 'faculty') {
      requiredFields.push('department');
    }

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (formData.firstName.length < 2 || formData.lastName.length < 2) {
      setError('First name and last name must be at least 2 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.role === 'student') {
      if (!/^\d{2}[A-Z]{2}\d{3}$/.test(formData.studentId)) {
        setError('Student ID must be in format: 21CE123');
        return false;
      }

      const year = parseInt(formData.currentYear);
      if (isNaN(year) || year < 1 || year > 4) {
        setError('Current year must be between 1 and 4');
        return false;
      }

      const semester = parseInt(formData.currentSemester);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        setError('Current semester must be between 1 and 8');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Prepare registration data
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        // Include additional fields based on role
        ...(formData.role === 'student' && {
          studentId: formData.studentId,
          department: formData.department,
          branch: formData.branch,
          currentYear: parseInt(formData.currentYear),
          currentSemester: parseInt(formData.currentSemester),
          academicYear: formData.academicYear
        }),
        ...(formData.role === 'faculty' && {
          facultyId: generateFacultyId(),
          department: formData.department
        })
      };

      await register(registrationData);
      navigate('/');
    } catch (err: any) {
      let errorMessage = 'Failed to create an account';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        errorMessage = Object.values(err.response.data.errors)
          .filter(Boolean)
          .join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="firstName"
            label="First Name"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleTextChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="lastName"
            label="Last Name"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleTextChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="email"
            label="Email Address"
            autoComplete="email"
            value={formData.email}
            onChange={handleTextChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleTextChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleTextChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          {/* Role-specific fields */}
          {formData.role && formData.role !== 'admin' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                label="Department"
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="Computer Engineering">Computer Engineering</MenuItem>
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Mechanical">Mechanical</MenuItem>
              </Select>
            </FormControl>
          )}

          {formData.role === 'student' && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                name="studentId"
                label="Student ID (e.g., 21CE123)"
                value={formData.studentId}
                onChange={handleTextChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="branch"
                label="Branch"
                value={formData.branch}
                onChange={handleTextChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="currentYear"
                label="Current Year (1-4)"
                type="number"
                value={formData.currentYear}
                onChange={handleTextChange}
                inputProps={{ min: 1, max: 4 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="currentSemester"
                label="Current Semester (1-8)"
                type="number"
                value={formData.currentSemester}
                onChange={handleTextChange}
                inputProps={{ min: 1, max: 8 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="academicYear"
                label="Academic Year (e.g., 2023-2024)"
                value={formData.academicYear}
                onChange={handleTextChange}
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register; 