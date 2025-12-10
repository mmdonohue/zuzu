// src/pages/VerifyCode.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/auth.service';

const VerifyCode: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const userId = location.state?.userId;
  const email = location.state?.email;
  const fromSignup = location.state?.fromSignup;

  useEffect(() => {
    // Redirect if no userId
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setCode(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyCode({ userId, code });

      if (response.success && response.data?.user) {
        // Update auth context
        login(response.data.user);

        // Show success message briefly then redirect
        setSuccess('Verification successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid or expired code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.resendCode(userId);
      if (response.success) {
        setSuccess('A new verification code has been sent to your email');
      }
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Verify Your Email
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </Typography>

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

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Verification Code"
            value={code}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{
              maxLength: 6,
              style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
            }}
            placeholder="000000"
            helperText="Enter the 6-digit code from your email"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || code.length !== 6}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify Code'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Didn't receive the code?
          </Typography>
          <Button
            variant="text"
            onClick={handleResendCode}
            disabled={resending}
            sx={{ textTransform: 'none' }}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </Button>
        </Box>

        {fromSignup && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              The code expires in 5 minutes
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyCode;
