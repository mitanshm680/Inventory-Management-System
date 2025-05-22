import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  TextField,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import WarningIcon from '@mui/icons-material/Warning';
import HistoryIcon from '@mui/icons-material/History';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import api from '../utils/api';
import { useTheme } from '@mui/material/styles';

// Register ChartJS components
Chart.register(...registerables);

const Reports = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [stockThreshold, setStockThreshold] = useState(10);
  const [activityDays, setActivityDays] = useState(30);
  const [reportFormat, setReportFormat] = useState('csv');
  const [reportGroups, setReportGroups] = useState('');
  const [reportFilename, setReportFilename] = useState('inventory_report');
  const [groups, setGroups] = useState([]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportPath, setReportPath] = useState('');
  
  // Move theme here at component level
  const theme = useTheme();
  
  // Define chart colors here
  const chartColors = {
    additions: theme.palette.success.main,
    additions_light: theme.palette.success.light,
    removals: theme.palette.warning.main, 
    removals_light: theme.palette.warning.light,
    deletions: theme.palette.error.main,
    deletions_light: theme.palette.error.light
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchLowStockItems();
    } else if (activeTab === 2) {
      fetchActivityReport();
    }
  }, [activeTab]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const fetchLowStockItems = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/low-stock?threshold=${stockThreshold}`);
      setLowStockItems(response.data);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      setError('Failed to load low stock items');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/activity?days=${activityDays}`);
      setActivityData(response.data);
    } catch (error) {
      console.error('Error fetching activity report:', error);
      setError('Failed to load activity report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setReportGenerating(true);
    try {
      const groupsParam = reportGroups ? `&groups=${reportGroups}` : '';
      const response = await api.post(
        `/reports/inventory?filename=${reportFilename}&format_type=${reportFormat}${groupsParam}`
      );
      setReportMessage(`Report generated successfully: ${response.data.message}`);
      setReportPath(response.data.file_path || `${reportFilename}.${reportFormat}`);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderLowStockTab = () => (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Stock Threshold"
          type="number"
          value={stockThreshold}
          onChange={(e) => setStockThreshold(e.target.value)}
          InputProps={{ inputProps: { min: 1 } }}
          sx={{ width: '150px' }}
        />
        <Button variant="contained" onClick={fetchLowStockItems}>
          Update
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : lowStockItems.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Group</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.item_name}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.group_name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Alert severity="info">No items below the stock threshold.</Alert>
      )}
    </Box>
  );

  const renderInventoryReportTab = () => (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Inventory Report
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Filename"
              value={reportFilename}
              onChange={(e) => setReportFilename(e.target.value)}
              margin="normal"
              helperText="Reports are saved in the project's root directory"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Format</InputLabel>
              <Select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                label="Format"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Filter by Groups (Optional)</InputLabel>
              <Select
                value={reportGroups}
                onChange={(e) => setReportGroups(e.target.value)}
                label="Filter by Groups (Optional)"
              >
                <MenuItem value="">All Groups</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={generateReport}
              disabled={reportGenerating || !reportFilename}
              sx={{ mt: 2 }}
              color="primary"
            >
              {reportGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
          
          {reportMessage && (
            <Grid item xs={12}>
              <Alert 
                severity="success" 
                sx={{ mt: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      // This would ideally open the file, but for now just show where it is
                      alert(`Report saved at: ${reportPath}`);
                    }}
                  >
                    View Location
                  </Button>
                }
              >
                {reportMessage}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );

  const renderActivityReportTab = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Days"
            type="number"
            value={activityDays}
            onChange={(e) => setActivityDays(e.target.value)}
            InputProps={{ inputProps: { min: 1 } }}
            sx={{ width: '150px' }}
          />
          <Button variant="contained" onClick={fetchActivityReport}>
            Update
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : activityData ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Activity Summary
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.dark">{activityData.additions}</Typography>
                      <Typography variant="body2" fontWeight="medium">Items Added</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.dark">{activityData.removals}</Typography>
                      <Typography variant="body2" fontWeight="medium">Items Removed</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, minWidth: 120, textAlign: 'center' }}>
                      <Typography variant="h4" color="error.dark">{activityData.deletions}</Typography>
                      <Typography variant="body2" fontWeight="medium">Items Deleted</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Period: Last {activityData.period_days} days
                  </Typography>
                  <Typography variant="body2">
                    Unique Items Added: {activityData.items_added.length}
                  </Typography>
                  <Typography variant="body2">
                    Unique Items Removed: {activityData.items_removed.length}
                  </Typography>
                  <Typography variant="body2">
                    Unique Items Deleted: {activityData.items_deleted.length}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Last Updated: {formatDate(activityData.timestamp)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Activity Chart
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Bar
                      data={{
                        labels: ['Additions', 'Removals', 'Deletions'],
                        datasets: [
                          {
                            label: 'Activity Count',
                            data: [
                              activityData.additions,
                              activityData.removals,
                              activityData.deletions,
                            ],
                            backgroundColor: [
                              chartColors.additions_light,
                              chartColors.removals_light,
                              chartColors.deletions_light,
                            ],
                            borderColor: [
                              chartColors.additions,
                              chartColors.removals,
                              chartColors.deletions,
                            ],
                            borderWidth: 2,
                            borderRadius: 6,
                            hoverBackgroundColor: [
                              chartColors.additions,
                              chartColors.removals,
                              chartColors.deletions,
                            ]
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: theme.palette.background.paper,
                            titleColor: theme.palette.text.primary,
                            bodyColor: theme.palette.text.secondary,
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 8,
                            usePointStyle: true,
                            titleFont: {
                              weight: 'bold',
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: theme.palette.divider,
                              drawBorder: false,
                            },
                            ticks: {
                              precision: 0,
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {activityData.items_added.length > 0 && (
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity Details
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[
                            ...activityData.items_added.map(item => ({ item, action: 'Added' })),
                            ...activityData.items_removed.map(item => ({ item, action: 'Removed' })),
                            ...activityData.items_deleted.map(item => ({ item, action: 'Deleted' }))
                          ]
                          .slice(0, 10)
                          .map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{entry.item}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={entry.action} 
                                  size="small" 
                                  color={
                                    entry.action === 'Added' ? 'success' : 
                                    entry.action === 'Removed' ? 'warning' : 'error'
                                  } 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>Recent</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="info">No activity data available.</Alert>
        )}
      </Box>
    );
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
          <Tab icon={<WarningIcon />} label="Low Stock" />
          <Tab icon={<FileDownloadIcon />} label="Generate Report" />
          <Tab icon={<HistoryIcon />} label="Activity Report" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderLowStockTab()}
      {activeTab === 1 && renderInventoryReportTab()}
      {activeTab === 2 && renderActivityReportTab()}
    </Container>
  );
};

export default Reports; 