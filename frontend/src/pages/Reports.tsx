import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Reports: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            Logged in as: {user?.name} ({user?.role})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This is the reports page. The TypeScript version is under development.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Reports; 