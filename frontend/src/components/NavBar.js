import React, { useState, useEffect } from 'react';
import { AppBar, Box, Toolbar, Typography, Button, IconButton, Drawer, 
  List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import { logout } from '../utils/auth';

const NavBar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', requiredRole: 'viewer' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory', requiredRole: 'viewer' },
    { text: 'Groups', icon: <CategoryIcon />, path: '/groups', requiredRole: 'editor' },
    { text: 'Price Management', icon: <PriceChangeIcon />, path: '/prices', requiredRole: 'viewer' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', requiredRole: 'viewer' },
    { text: 'User Management', icon: <GroupIcon />, path: '/users', requiredRole: 'admin' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', requiredRole: 'admin' },
  ];

  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Inventory System
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Logged in as {user.username} ({user.role})
          </Typography>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.requiredRole || (user && (
            user.role === 'admin' || 
            (user.role === 'editor' && item.requiredRole !== 'admin') || 
            (user.role === 'viewer' && item.requiredRole === 'viewer')
          )))
          .map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Inventory Management System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default NavBar; 