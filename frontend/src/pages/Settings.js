import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../utils/api';

const Settings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openConfirmBackup, setOpenConfirmBackup] = useState(false);

  const handleCreateBackup = async () => {
    setLoading(true);
    setOpenConfirmBackup(false);
    
    try {
      const response = await api.post('/backup');
      setSuccessMessage(`Backup created successfully: ${response.data.message}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    
    try {
      // This is just a placeholder - would need to implement the actual API endpoint
      // const response = await api.post('/report/generate');
      setSuccessMessage('Report generation feature will be available soon');
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Box sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            System Operations
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <List>
            <ListItem>
              <ListItemIcon>
                <BackupIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Database Backup" 
                secondary="Create a backup of the current database"
              />
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setOpenConfirmBackup(true)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Backup'}
              </Button>
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <DownloadIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Generate Full Report" 
                secondary="Create a comprehensive report of the inventory"
              />
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                Generate
              </Button>
            </ListItem>
            
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <RestoreIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Restore Database" 
                secondary="Restore from a previous backup (admin only)"
              />
              <Button 
                variant="outlined" 
                color="primary"
                disabled={true}
              >
                Coming Soon
              </Button>
            </ListItem>
          </List>
        </Paper>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            About
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1">
            Inventory Management System
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Version 1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This system helps you manage your inventory with features for tracking items, 
            managing users, and generating reports.
          </Typography>
        </Paper>
      </Box>
      
      <Dialog
        open={openConfirmBackup}
        onClose={() => setOpenConfirmBackup(false)}
      >
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to create a backup of the current database?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmBackup(false)}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained" color="primary">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings; 