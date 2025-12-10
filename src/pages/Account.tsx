// src/pages/Account.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';

const Account: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">Please log in to view your account</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Account
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Profile Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              First Name
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {user.firstName}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Name
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {user.lastName}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Email Address
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {user.email}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              User ID
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
              {user.id}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Role
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={user.role.toUpperCase()}
                color="primary"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Account Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Typography variant="body2" color="text.secondary">
          Additional account management features will be available here, such as:
        </Typography>
        <Box component="ul" sx={{ mt: 2, color: 'text.secondary' }}>
          <li>Change password</li>
          <li>Update profile information</li>
          <li>Email preferences</li>
          <li>Two-factor authentication</li>
          <li>Delete account</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default Account;
