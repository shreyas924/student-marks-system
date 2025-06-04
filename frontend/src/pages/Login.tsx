import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api, { checkServerHealth } from '../api/axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      setServerStatus('checking');
      const isHealthy = await checkServerHealth(`${BASE_URL}/health`);
      setServerStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('Server connection check failed:', error);
      setServerStatus('offline');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (serverStatus === 'offline') {
      setError('Server is offline. Please ensure the backend server is running and try again.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data.data;
      await login(token, user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .filter(Boolean)
          .join(', ');
        setError(errorMessages);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect to the server. Please ensure the backend server is running and try again.');
        setServerStatus('offline');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getServerStatusMessage = () => {
    switch (serverStatus) {
      case 'checking':
        return { severity: 'info', message: 'Checking server status...' };
      case 'online':
        return { severity: 'success', message: 'Server is online' };
      case 'offline':
        return {
          severity: 'error',
          message: 'Server is offline. Please ensure the backend server is running.'
        };
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Sign in
        </Typography>

        <Alert 
          severity={getServerStatusMessage().severity as 'error' | 'info' | 'success'}
          sx={{ mb: 2, width: '100%' }}
        >
          {getServerStatusMessage().message}
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || serverStatus === 'offline'}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || serverStatus === 'offline'}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || serverStatus === 'offline'}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          {serverStatus === 'offline' && (
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={checkServerConnection}
              sx={{ mb: 2 }}
            >
              Retry Connection
            </Button>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 