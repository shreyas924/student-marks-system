import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Typography,
  FormHelperText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    branch: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    year: '',
    semester: '',
    branch: '',
    credits: 4,
    description: ''
  });

  // Define constants for options
  const YEARS = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' }
  ];

  const BRANCHES = [
    { value: 'CE', label: 'CE' },
    { value: 'IT', label: 'IT' },
    { value: 'AIDS', label: 'AIDS' }
  ];

  const SEMESTER_MAP = {
    1: [
      { value: 1, label: 'Semester 1' },
      { value: 2, label: 'Semester 2' }
    ],
    2: [
      { value: 3, label: 'Semester 3' },
      { value: 4, label: 'Semester 4' }
    ],
    3: [
      { value: 5, label: 'Semester 5' },
      { value: 6, label: 'Semester 6' }
    ],
    4: [
      { value: 7, label: 'Semester 7' },
      { value: 8, label: 'Semester 8' }
    ]
  };

  useEffect(() => {
    fetchSubjects();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get('/api/admin/subjects/filter?' + params);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Subject name is required';
    if (!formData.code.trim()) newErrors.code = 'Subject code is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    if (formData.credits < 1 || formData.credits > 6) {
      newErrors.credits = 'Credits must be between 1 and 6';
    }

    // Validate semester based on year
    if (formData.year && formData.semester) {
      const validSemesters = SEMESTER_MAP[formData.year].map(s => s.value);
      if (!validSemesters.includes(formData.semester)) {
        newErrors.semester = 'Invalid semester for selected year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpen = (subject = null) => {
    setErrors({});
    if (subject) {
      setFormData(subject);
      setEditMode(true);
    } else {
      setFormData({
        name: '',
        code: '',
        year: '',
        semester: '',
        branch: '',
        credits: 4,
        description: ''
      });
      setEditMode(false);
    }
    setSelectedSubject(subject);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSubject(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editMode) {
        await axios.put('/api/admin/subjects/' + selectedSubject.id, formData);
      } else {
        await axios.post('/api/admin/subjects', formData);
      }
      handleClose();
      fetchSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await axios.delete('/api/admin/subjects/' + id);
        fetchSubjects();
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      // Reset semester if year changes
      if (field === 'year') {
        newFilters.semester = '';
      }
      return newFilters;
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset semester if year changes
      if (field === 'year') {
        newData.semester = '';
      }
      return newData;
    });
    // Clear error for the changed field
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subject Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filters.year}
                label="Year"
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {YEARS.map(year => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={filters.semester}
                label="Semester"
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                disabled={!filters.year}
              >
                <MenuItem value="">All</MenuItem>
                {filters.year && SEMESTER_MAP[filters.year].map(sem => (
                  <MenuItem key={sem.value} value={sem.value}>
                    {sem.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={filters.branch}
                label="Branch"
                onChange={(e) => handleFilterChange('branch', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {BRANCHES.map(branch => (
                  <MenuItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 2 }}
      >
        Add New Subject
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>
                  {YEARS.find(y => y.value === subject.year)?.label || subject.year}
                </TableCell>
                <TableCell>
                  {SEMESTER_MAP[subject.year]?.find(s => s.value === subject.semester)?.label || subject.semester}
                </TableCell>
                <TableCell>{subject.branch}</TableCell>
                <TableCell>{subject.credits}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(subject)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(subject.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Code"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  error={!!errors.code}
                  helperText={errors.code}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.year} required>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={formData.year}
                    label="Year"
                    onChange={(e) => handleFormChange('year', e.target.value)}
                  >
                    {YEARS.map(year => (
                      <MenuItem key={year.value} value={year.value}>
                        {year.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.year && <FormHelperText>{errors.year}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.semester} required>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester}
                    label="Semester"
                    onChange={(e) => handleFormChange('semester', e.target.value)}
                    disabled={!formData.year}
                  >
                    {formData.year && SEMESTER_MAP[formData.year].map(sem => (
                      <MenuItem key={sem.value} value={sem.value}>
                        {sem.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.semester && <FormHelperText>{errors.semester}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.branch} required>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={formData.branch}
                    label="Branch"
                    onChange={(e) => handleFormChange('branch', e.target.value)}
                  >
                    {BRANCHES.map(branch => (
                      <MenuItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.branch && <FormHelperText>{errors.branch}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Credits"
                  value={formData.credits}
                  onChange={(e) => handleFormChange('credits', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 6 } }}
                  error={!!errors.credits}
                  helperText={errors.credits}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </Grid>
            </Grid>
            {errors.submit && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectManagement; 