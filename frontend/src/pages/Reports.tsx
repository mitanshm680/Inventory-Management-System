import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface LowStockItem {
  item_name: string;
  quantity: number;
  group_name?: string;
  threshold?: number;
}

interface InventoryReport {
  timestamp: string;
  summary: {
    total_items: number;
    total_quantity: number;
    groups_count: number;
  };
  groups_breakdown: Record<string, { count: number; total_quantity: number }>;
  low_stock_items: LowStockItem[];
  low_stock_count: number;
}

interface Activity {
  action: string;
  item_name: string;
  quantity: number;
  group_name?: string;
  timestamp: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [threshold, setThreshold] = useState(10);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all reports in parallel
      const [lowStockData, reportData, activityData] = await Promise.all([
        apiService.getLowStockReport(threshold),
        apiService.getInventoryReport(),
        apiService.get('/reports/activity?limit=20')
      ]);

      setLowStockItems(lowStockData.low_stock_items || []);
      setInventoryReport(reportData);
      setActivities(activityData.activities || []);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.detail || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    try {
      if (user?.role !== 'admin') {
        alert('Only admins can export data');
        return;
      }
      const blob = await apiService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Reports & Analytics</Typography>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        {inventoryReport && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InventoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="body2">
                      Total Items
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {inventoryReport.summary.total_items}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="body2">
                      Total Quantity
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {inventoryReport.summary.total_quantity}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon color="info" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="body2">
                      Groups
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {inventoryReport.summary.groups_count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" variant="body2">
                      Low Stock Items
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {inventoryReport.low_stock_count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Grid container spacing={3}>
          {/* Low Stock Items */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Low Stock Alerts</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Threshold</InputLabel>
                  <Select
                    value={threshold}
                    label="Threshold"
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={15}>15</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {lowStockItems.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Group</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.item_name}>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>
                            {item.group_name ? (
                              <Chip label={item.group_name} size="small" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={item.quantity}
                              size="small"
                              color="warning"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No low stock items
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Groups Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Groups Breakdown
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {inventoryReport && Object.keys(inventoryReport.groups_breakdown).length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Group</TableCell>
                        <TableCell align="right">Items</TableCell>
                        <TableCell align="right">Total Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(inventoryReport.groups_breakdown).map(([group, data]) => (
                        <TableRow key={group}>
                          <TableCell>
                            <Chip label={group} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{data.count}</TableCell>
                          <TableCell align="right">{data.total_quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No groups found
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {activities.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell>Group</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={activity.action}
                              size="small"
                              color={
                                activity.action === 'ADD' || activity.action === 'CREATE'
                                  ? 'success'
                                  : activity.action === 'REMOVE' || activity.action === 'DELETE'
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{activity.item_name}</TableCell>
                          <TableCell>
                            {activity.group_name ? (
                              <Chip label={activity.group_name} size="small" variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">{activity.quantity || '-'}</TableCell>
                          <TableCell>
                            {new Date(activity.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No recent activity
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Reports;
