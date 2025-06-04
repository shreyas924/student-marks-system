import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('performance');
  const [reportData, setReportData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    semester: ''
  });

  const YEARS = [1, 2, 3, 4];
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
  const DEPARTMENTS = [
    { code: 'CE', name: 'Computer Engineering' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'AIDS', name: 'Artificial Intelligence and Data Science' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, filters]);

  const fetchReportData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/${selectedReport}`, {
        params: filters
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const renderPerformanceReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageMarks" fill="#8884d8" name="Average Marks" />
            <Bar dataKey="passPercentage" fill="#82ca9d" name="Pass Percentage" />
          </BarChart>
        </ResponsiveContainer>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Total Students</TableCell>
                <TableCell align="right">Average Marks</TableCell>
                <TableCell align="right">Pass Percentage</TableCell>
                <TableCell align="right">Highest Mark</TableCell>
                <TableCell align="right">Lowest Mark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.subject}>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell align="right">{row.totalStudents}</TableCell>
                  <TableCell align="right">{row.averageMarks.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.passPercentage.toFixed(2)}%</TableCell>
                  <TableCell align="right">{row.highestMark}</TableCell>
                  <TableCell align="right">{row.lowestMark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  const renderAttendanceReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageAttendance" fill="#8884d8" name="Average Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Total Classes</TableCell>
                <TableCell align="right">Average Attendance %</TableCell>
                <TableCell align="right">Students Below 75%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.subject}>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell align="right">{row.totalClasses}</TableCell>
                  <TableCell align="right">{row.averageAttendance.toFixed(2)}%</TableCell>
                  <TableCell align="right">{row.studentsBelow75}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={selectedReport}
                label="Report Type"
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                <MenuItem value="performance">Performance Report</MenuItem>
                <MenuItem value="attendance">Attendance Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <MenuItem value="">All Departments</MenuItem>
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept.code} value={dept.code}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filters.year}
                label="Year"
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              >
                <MenuItem value="">All Years</MenuItem>
                {YEARS.map((year) => (
                  <MenuItem key={year} value={year}>
                    Year {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={filters.semester}
                label="Semester"
                onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
              >
                <MenuItem value="">All Semesters</MenuItem>
                {SEMESTERS.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    Semester {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {selectedReport === 'performance' ? renderPerformanceReport() : renderAttendanceReport()}
    </Box>
  );
};

export default Reports; 