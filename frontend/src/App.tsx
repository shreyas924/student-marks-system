import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarksEntry from './pages/faculty/MarksEntry';
import StudentDashboard from './pages/student/StudentDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<Layout />}>
              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* Faculty Routes */}
              <Route
                path="faculty"
                element={
                  <PrivateRoute allowedRoles={['faculty']}>
                    <FacultyDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="faculty/marks-entry/:subjectId"
                element={
                  <PrivateRoute allowedRoles={['faculty']}>
                    <MarksEntry />
                  </PrivateRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="student"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </PrivateRoute>
                }
              />

              {/* Default Route */}
              <Route
                path="/"
                element={<DefaultRedirect />}
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Helper component to redirect based on user role
const DefaultRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'faculty':
      return <Navigate to="/faculty" />;
    case 'student':
      return <Navigate to="/student" />;
    default:
      return <Navigate to="/login" />;
  }
};

export default App; 