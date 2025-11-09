import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Button
} from '@mui/material';
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
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import QrCodeIcon from '@mui/icons-material/QrCode';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppMode } from '../contexts/AppModeContext';
import AlertsPanel from './AlertsPanel';
import GlobalSearch from './GlobalSearch';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiredRole: 'admin' | 'editor' | 'viewer';
  advancedOnly?: boolean;
}

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toggleColorMode, mode } = useTheme();
  const { isSimpleMode } = useAppMode();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', requiredRole: 'viewer' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory', requiredRole: 'viewer' },
    { text: 'Suppliers', icon: <LocalShippingIcon />, path: '/suppliers', requiredRole: 'viewer' },
    { text: 'Locations', icon: <WarehouseIcon />, path: '/locations', requiredRole: 'editor', advancedOnly: true },
    { text: 'Batches', icon: <QrCodeIcon />, path: '/batches', requiredRole: 'viewer', advancedOnly: true },
    { text: 'Stock Adjustments', icon: <HistoryIcon />, path: '/stock-adjustments', requiredRole: 'editor' },
    { text: 'Price Management', icon: <PriceChangeIcon />, path: '/prices', requiredRole: 'viewer', advancedOnly: true },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', requiredRole: 'viewer' },
    { text: 'Groups', icon: <CategoryIcon />, path: '/groups', requiredRole: 'editor', advancedOnly: true },
    { text: 'User Management', icon: <GroupIcon />, path: '/users', requiredRole: 'admin', advancedOnly: true },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', requiredRole: 'admin' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Inventory System
        </Typography>
        {user && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <Avatar sx={{ bgcolor: muiTheme.palette.primary.main, mb: 1 }}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2">
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems
          .filter(item => {
            // Filter by role permission
            const hasRole = !item.requiredRole || (user && (
              user.role === 'admin' ||
              (user.role === 'editor' && item.requiredRole !== 'admin') ||
              (user.role === 'viewer' && item.requiredRole === 'viewer')
            ));

            // Filter by app mode (hide advanced features in simple mode)
            const isVisibleInMode = !item.advancedOnly || !isSimpleMode;

            return hasRole && isVisibleInMode;
          })
          .map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              selected={isActive(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: `${muiTheme.palette.primary.main}20`,
                  borderLeft: `4px solid ${muiTheme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: `${muiTheme.palette.primary.main}30`,
                  }
                },
                '&:hover': {
                  backgroundColor: `${muiTheme.palette.primary.main}10`,
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={toggleColorMode}>
          <ListItemIcon>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </ListItemIcon>
          <ListItemText primary={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
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

          {/* Search Button */}
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => setSearchOpen(true)}
              sx={{
                mr: 2,
                color: 'inherit',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'none',
                minWidth: 200,
                justifyContent: 'space-between',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
              endIcon={
                <Box
                  component="kbd"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  Ctrl+K
                </Box>
              }
            >
              Search...
            </Button>
          )}

          {isMobile && (
            <Tooltip title="Search">
              <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}

          {!isMobile && (
            <>
              <AlertsPanel />
              <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                <IconButton color="inherit" onClick={toggleColorMode} sx={{ ml: 1 }}>
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default NavBar; 