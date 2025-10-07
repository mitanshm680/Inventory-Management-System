import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { apiService } from '../services/api';

interface AlertType {
  id: number;
  alert_type: string;
  severity: string;
  item_name?: string;
  location_id?: number;
  batch_id?: number;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await apiService.getAlerts({ unread_only: false });
      // Ensure data is an array
      const alertsArray = Array.isArray(data) ? data : [];
      setAlerts(alertsArray);
      setUnreadCount(alertsArray.filter((alert: AlertType) => !alert.is_read && !alert.is_resolved).length);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlerts([]);
    }
  };

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await apiService.updateAlert(alertId, { is_read: true });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await apiService.updateAlert(alertId, { is_resolved: true });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'low_stock':
      case 'reorder':
        return <InventoryIcon />;
      case 'expiring_soon':
      case 'expired':
        return <EventIcon />;
      case 'batch_recall':
        return <LocalShippingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.is_resolved);
  const resolvedAlerts = alerts.filter(alert => alert.is_resolved);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={() => setDrawerOpen(true)}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 400 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Alerts</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeAlerts.length > 0 ? (
              <>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 'bold' }}>
                  Active Alerts ({activeAlerts.length})
                </Typography>
                <List>
                  {activeAlerts.map((alert) => (
                    <React.Fragment key={alert.id}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          bgcolor: alert.is_read ? 'transparent' : 'action.hover',
                          '&:hover': {
                            bgcolor: 'action.selected'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getSeverityIcon(alert.severity)}
                          </ListItemIcon>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={alert.alert_type.replace('_', ' ')}
                            size="small"
                            color={getSeverityColor(alert.severity)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Box>

                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              {alert.message}
                            </Typography>
                          }
                          secondary={alert.item_name}
                        />

                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {!alert.is_read && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleResolve(alert.id)}
                            startIcon={<CheckCircleIcon />}
                          >
                            Resolve
                          </Button>
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : (
              <Alert severity="success" sx={{ m: 2 }}>
                No active alerts. Everything looks good!
              </Alert>
            )}

            {resolvedAlerts.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, pt: 3, fontWeight: 'bold', color: 'text.secondary' }}>
                  Resolved ({resolvedAlerts.length})
                </Typography>
                <List>
                  {resolvedAlerts.slice(0, 5).map((alert) => (
                    <React.Fragment key={alert.id}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          opacity: 0.6
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                              {alert.message}
                            </Typography>
                          }
                          secondary={
                            alert.resolved_by && alert.resolved_at ? (
                              <Typography variant="caption" color="text.secondary">
                                Resolved by {alert.resolved_by} on {new Date(alert.resolved_at).toLocaleString()}
                              </Typography>
                            ) : (
                              alert.item_name
                            )
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </>
        )}

        <Box sx={{ p: 2, mt: 'auto' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={async () => {
              try {
                await apiService.checkReorderLevels();
                fetchAlerts();
              } catch (err) {
                console.error('Failed to check reorder levels:', err);
              }
            }}
          >
            Check Reorder Levels
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default AlertsPanel;
