import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  SelectChangeEvent,
  Pagination,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { apiService } from '../services/api';
import { getErrorMessage } from '../utils/validationSchemas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const AuditLog: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [userName, setUserName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Statistics
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionType, entityType, userName, startDate, endDate]);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await apiService.get('/audit-log', {
        params: {
          action_type: actionType || undefined,
          entity_type: entityType || undefined,
          user_name: userName || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          limit,
          offset,
        },
      });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/audit-log/statistics', {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setStatistics(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleClearFilters = () => {
    setActionType('');
    setEntityType('');
    setUserName('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'login':
      case 'logout':
        return 'default';
      case 'export':
      case 'import':
        return 'primary';
      default:
        return 'default';
    }
  };

  const actionsChartData = statistics
    ? {
        labels: statistics.actions_breakdown.map((item: any) => item.action_type.toUpperCase()),
        datasets: [
          {
            label: 'Action Count',
            data: statistics.actions_breakdown.map((item: any) => item.count),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      }
    : null;

  const hourlyActivityChartData = statistics
    ? {
        labels: statistics.hourly_activity.map((item: any) => item.hour),
        datasets: [
          {
            label: 'Actions per Hour',
            data: statistics.hourly_activity.map((item: any) => item.count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const totalPages = Math.ceil(total / limit);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Audit Log
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchLogs}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Actions
                  </Typography>
                </Box>
                <Typography variant="h3">{statistics.totals.total_actions?.toLocaleString() || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Successful
                  </Typography>
                </Box>
                <Typography variant="h3">{statistics.totals.successful_actions?.toLocaleString() || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {statistics.totals.total_actions > 0
                    ? ((statistics.totals.successful_actions / statistics.totals.total_actions) * 100).toFixed(1)
                    : 0}
                  % success rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
                <Typography variant="h3">{statistics.totals.failed_actions?.toLocaleString() || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Require attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
                <Typography variant="h3">{statistics.top_users?.length || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  In selected period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Activity Log" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {/* Activity Log Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={actionType}
                    label="Action Type"
                    onChange={(e: SelectChangeEvent) => {
                      setActionType(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="create">Create</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="logout">Logout</MenuItem>
                    <MenuItem value="export">Export</MenuItem>
                    <MenuItem value="import">Import</MenuItem>
                    <MenuItem value="approve">Approve</MenuItem>
                    <MenuItem value="reject">Reject</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                    <MenuItem value="adjust">Adjust</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Entity Type"
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g., item, user, order"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="User Name"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by username"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button fullWidth variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity Name</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action_type.toUpperCase()}
                        color={getActionColor(log.action_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell>{log.entity_name || log.entity_id || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {log.user_name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ maxWidth: 300, display: 'block' }}>
                        {log.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Tooltip title="Success">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <Tooltip title={log.error_message || 'Failed'}>
                          <ErrorIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {logs.length} of {total.toLocaleString()} records
          </Typography>
        </Box>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={1}>
        {statistics && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Actions Breakdown
                    </Typography>
                    {actionsChartData && (
                      <Box sx={{ height: 300 }}>
                        <Bar
                          data={actionsChartData}
                          options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Activity Last 24 Hours
                    </Typography>
                    {hourlyActivityChartData && (
                      <Box sx={{ height: 300 }}>
                        <Line
                          data={hourlyActivityChartData}
                          options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Active Users
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {statistics.top_users.map((user: any, index: number) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                  {user.user_name}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{user.action_count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Entity Types
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Entity Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {statistics.entities_breakdown.map((entity: any, index: number) => (
                            <TableRow key={index} hover>
                              <TableCell>{entity.entity_type}</TableCell>
                              <TableCell align="right">{entity.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>
    </Box>
  );
};

export default AuditLog;
