import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import api from '../../api/axios';

interface FacultyProfile {
  facultyId: string;
  department: string;
}

interface Faculty {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  facultyProfile?: FacultyProfile;
}

type ValidYear = 1 | 2 | 3 | 4;
type ValidSemester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type ValidSemesters = {
  [K in ValidYear]: number[];
};

interface FormData {
  name: string;
  code: string;
  facultyId: string;
  year: string;
  semester: string;
  branch: string;
}

interface AssignSubjectFormProps {
  onSuccess?: () => void;
}

const AssignSubjectForm: React.FC<AssignSubjectFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    facultyId: '',
    year: '',
    semester: '',
    branch: ''
  });
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/faculty');
      
      if (response.data?.status === 'success' && Array.isArray(response.data?.data)) {
        const facultyMembers = response.data.data as Faculty[];
        if (facultyMembers.length === 0) {
          setError('No faculty members found');
        } else {
          // Filter out inactive faculty members or those without proper profiles if needed
          const validFacultyMembers = facultyMembers.filter(
            (f: Faculty) => f.firstName && f.lastName
          );
          setFaculty(validFacultyMembers);
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch faculty members';
      setError(errorMessage);
      setFaculty([]); // Reset faculty list on error
    } finally {
      setLoading(false);
    }
  };

  const getSemesterOptions = () => {
    switch (formData.year) {
      case '1':
        return [1, 2];
      case '2':
        return [3, 4];
      case '3':
        return [5, 6];
      case '4':
        return [7, 8];
      default:
        return [];
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.code || !formData.facultyId || 
        !formData.year || !formData.semester || !formData.branch) {
      throw new Error('Please fill in all required fields');
    }

    // Validate subject code format
    if (!/^[A-Z0-9]+$/.test(formData.code)) {
      throw new Error('Subject code must contain only uppercase letters and numbers');
    }

    // Validate subject name length
    if (formData.name.length < 3 || formData.name.length > 100) {
      throw new Error('Subject name must be between 3 and 100 characters');
    }

    // Validate semester for selected year
    const year = parseInt(formData.year) as ValidYear;
    const semester = parseInt(formData.semester);
    const validSemesters: ValidSemesters = {
      1: [1, 2],
      2: [3, 4],
      3: [5, 6],
      4: [7, 8]
    };

    if (!validSemesters[year] || !validSemesters[year].includes(semester)) {
      throw new Error('Invalid semester for selected year');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate form data
      validateForm();

      const response = await api.post('/subjects/assign', {
        subjectName: formData.name.trim(),
        subjectCode: formData.code.trim(),
        facultyId: parseInt(formData.facultyId),
        year: parseInt(formData.year),
        semester: parseInt(formData.semester),
        branch: formData.branch
      });

      if (response.data?.status === 'success' || response.status === 201) {
        setSuccess('Subject assigned successfully!');
        setFormData({
          name: '',
          code: '',
          facultyId: '',
          year: '',
          semester: '',
          branch: ''
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.data?.message || 'Failed to assign subject');
      }
    } catch (err: any) {
      console.error('Error assigning subject:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to assign subject. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    setError('');
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'year' ? { semester: '' } : {})
    }));
    // Clear error when user makes a selection
    setError('');
  };

  if (loading && faculty.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const getFacultyDisplayName = (f: Faculty) => {
    const name = `${f.firstName} ${f.lastName}`;
    if (f.facultyProfile) {
      return `${name} (${f.facultyProfile.facultyId}) - ${f.facultyProfile.department}`;
    }
    return name;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        required
        label="Subject Name"
        name="name"
        value={formData.name}
        onChange={handleTextChange}
        margin="normal"
        disabled={loading}
        error={Boolean(error && !formData.name)}
        helperText="Subject name must be between 3 and 100 characters"
      />

      <TextField
        fullWidth
        required
        label="Subject Code"
        name="code"
        value={formData.code}
        onChange={handleTextChange}
        margin="normal"
        disabled={loading}
        error={Boolean(error && !formData.code)}
        helperText="Use only uppercase letters and numbers"
      />

      <FormControl fullWidth margin="normal" required error={Boolean(error && !formData.facultyId)}>
        <InputLabel>Select Faculty</InputLabel>
        <Select
          name="facultyId"
          value={formData.facultyId}
          label="Select Faculty"
          onChange={handleSelectChange}
          disabled={loading}
        >
          {faculty.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {getFacultyDisplayName(f)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" required error={Boolean(error && !formData.branch)}>
        <InputLabel>Select Branch</InputLabel>
        <Select
          name="branch"
          value={formData.branch}
          label="Select Branch"
          onChange={handleSelectChange}
          disabled={loading}
        >
          <MenuItem value="CE">Computer Engineering</MenuItem>
          <MenuItem value="IT">Information Technology</MenuItem>
          <MenuItem value="AIDS">AI & Data Science</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" required error={Boolean(error && !formData.year)}>
        <InputLabel>Select Year</InputLabel>
        <Select
          name="year"
          value={formData.year}
          label="Select Year"
          onChange={handleSelectChange}
          disabled={loading}
        >
          <MenuItem value="1">1st Year</MenuItem>
          <MenuItem value="2">2nd Year</MenuItem>
          <MenuItem value="3">3rd Year</MenuItem>
          <MenuItem value="4">4th Year</MenuItem>
        </Select>
      </FormControl>

      <FormControl 
        fullWidth 
        margin="normal" 
        required 
        error={Boolean(error && !formData.semester)}
        disabled={!formData.year}
      >
        <InputLabel>Select Semester</InputLabel>
        <Select
          name="semester"
          value={formData.semester}
          label="Select Semester"
          onChange={handleSelectChange}
          disabled={loading || !formData.year}
        >
          {getSemesterOptions().map((sem) => (
            <MenuItem key={sem} value={sem.toString()}>
              Semester {sem}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Assign Subject'}
      </Button>
    </Box>
  );
};

export default AssignSubjectForm; 