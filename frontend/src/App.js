import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

// Components
import NavBar from './components/NavBar';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Prices from './pages/Prices';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Groups from './pages/Groups';

// Utils
import { getUser, isAuthenticated } from './utils/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user details:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {isAuthenticated() && <NavBar user={user} />}
        <Box sx={{ p: 3 }}>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory user={user} />
              </ProtectedRoute>
            } />
            <Route path="/prices" element={
              <ProtectedRoute>
                <Prices user={user} />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports user={user} />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                {user && user.role === 'admin' ? <Users user={user} /> : <Navigate to="/" />}
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                {user && user.role === 'admin' ? <Settings user={user} /> : <Navigate to="/" />}
              </ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute>
                {user && (user.role === 'admin' || user.role === 'editor') ? 
                  <Groups user={user} /> : <Navigate to="/" />}
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 