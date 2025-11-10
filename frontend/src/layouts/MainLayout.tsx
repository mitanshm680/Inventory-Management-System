import React, { ReactNode } from 'react';
import { Box, Container, useTheme } from '@mui/material';
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main layout component with navigation and consistent structure
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}
    >
      {user && <NavBar />}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          marginTop: '64px' // Height of app bar
        }}
      >
        <Container 
          maxWidth="lg"
          sx={{ 
            height: '100%'
          }}
        >
          {children}
        </Container>
      </Box>
      
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.grey[100] 
            : theme.palette.grey[900],
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} Inventory Management System
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout; 