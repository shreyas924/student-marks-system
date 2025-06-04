import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Chip,
  OutlinedInput
} from '@mui/material';
import api from '../../api/axios';

interface Faculty {
  id: string;
  name: string;
  email: string;
  facultyId: string;
  department: string;
}

interface AssignSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ASSESSMENT_TYPES = ['Assignment', 'CA', 'Midterm', 'Term Work', 'Theory'];

const AssignSubjectModal: React.FC<AssignSubjectModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    facultyId: '',
    subjectName: '',
    subjectCode: '',
    year: '',
    semester: '',
    branch: '',
    assessmentTypes: ASSESSMENT_TYPES
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/users/faculty');
      setFaculty(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError('Failed to fetch faculty members');
    }
  };

  const getValidSemesters = () => {
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'year' && { semester: '' }) // Reset semester when year changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/subjects/assign', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="assign-subject-modal"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Assign Subject to Faculty
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Faculty Member</InputLabel>
            <Select
              name="facultyId"
              value={formData.facultyId}
              onChange={handleSelectChange}
              required
            >
              {faculty.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name} ({f.facultyId})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            name="subjectName"
            label="Subject Name"
            value={formData.subjectName}
            onChange={handleTextChange}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            name="subjectCode"
            label="Subject Code"
            value={formData.subjectCode}
            onChange={handleTextChange}
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Year</InputLabel>
            <Select
              name="year"
              value={formData.year}
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="1">1st Year</MenuItem>
              <MenuItem value="2">2nd Year</MenuItem>
              <MenuItem value="3">3rd Year</MenuItem>
              <MenuItem value="4">4th Year</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Semester</InputLabel>
            <Select
              name="semester"
              value={formData.semester}
              onChange={handleSelectChange}
              required
              disabled={!formData.year}
            >
              {getValidSemesters().map((sem) => (
                <MenuItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Branch</InputLabel>
            <Select
              name="branch"
              value={formData.branch}
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="CE">CE</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="AIDS">AIDS</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Assessment Types</InputLabel>
            <Select
              multiple
              value={formData.assessmentTypes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                assessmentTypes: typeof e.target.value === 'string' 
                  ? e.target.value.split(',')
                  : e.target.value
              }))}
              input={<OutlinedInput label="Assessment Types" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {ASSESSMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Assign Subject'}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default AssignSubjectModal; 