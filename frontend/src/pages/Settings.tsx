import React, { useState } from 'react';
import {
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Switch,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LockIcon from '@mui/icons-material/Lock';
import BuildIcon from '@mui/icons-material/Build';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loading, setLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDarkModeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    window.location.reload(); // Reload to apply theme change
  };

  const handleBackupClick = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleBackupConfirm = async () => {
    setOpenDialog(false);
    setBackupInProgress(true);
    try {
      const response = await api.post('/backup');
      setSuccess(`Backup created successfully: ${response.data.filename}`);
    } catch (err) {
      console.error('Backup failed:', err);
      setError('Failed to create backup. Please try again.');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        {/* Admin only settings */}
        {isAdmin ? (
          <Grid container spacing={3}>
            {/* System Backup */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardHeader 
                  title="Database Management" 
                  avatar={
                    <StorageIcon color="primary" />
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    Create backups of the database or restore from previous backups.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<BackupIcon />}
                    onClick={handleBackupClick}
                    disabled={backupInProgress}
                  >
                    {backupInProgress ? 'Creating Backup...' : 'Create Backup'}
                  </Button>
                  {backupInProgress && (
                    <CircularProgress size={20} sx={{ ml: 2 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Security Settings */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardHeader 
                  title="Security Settings" 
                  avatar={
                    <SecurityIcon color="primary" />
                  }
                />
                <Divider />
                <CardContent>
                  <List disablePadding>
                    <ListItem disablePadding>
                      <ListItemButton>
                        <ListItemIcon>
                          <LockIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Token Expiration" 
                          secondary="30 minutes (default)" 
                        />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Advanced Settings */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardHeader 
                  title="System Configuration" 
                  avatar={
                    <BuildIcon color="primary" />
                  }
                />
                <Divider />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <DarkModeIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Dark Mode" 
                        secondary="Toggle between light and dark theme" 
                      />
                      <Switch
                        edge="end"
                        checked={darkMode}
                        onChange={handleDarkModeToggle}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="System Version" 
                        secondary="v1.0.0" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          // Non-admin settings
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are logged in as: <strong>{user?.username}</strong> ({user?.role})
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <DarkModeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary="Toggle between light and dark theme" 
                />
                <Switch
                  edge="end"
                  checked={darkMode}
                  onChange={handleDarkModeToggle}
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                For additional settings or administrative functions, please contact your administrator.
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
      
      {/* Backup Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Confirm Backup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to create a database backup? This operation might take some time depending on the database size.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleBackupConfirm} color="primary" variant="contained">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Messages */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 