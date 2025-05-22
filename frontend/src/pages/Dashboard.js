import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CardHeader,
  CircularProgress
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../utils/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalGroups: 0,
    lowStockItems: []
  });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get all inventory items
        const inventoryResponse = await api.get('/inventory');
        const inventory = inventoryResponse.data;
        
        // Get all groups
        const groupsResponse = await api.get('/groups');
        const groups = groupsResponse.data;
        
        // Calculate low stock items (less than 10)
        const lowStock = inventory.filter(item => item.quantity < 10);
        
        setStats({
          totalItems: inventory.length,
          totalGroups: groups.length,
          lowStockItems: lowStock
        });
        
        // Prepare data for chart
        const groupCounts = {};
        inventory.forEach(item => {
          const group = item.group || 'Ungrouped';
          if (!groupCounts[group]) {
            groupCounts[group] = 0;
          }
          groupCounts[group]++;
        });
        
        setChartData({
          labels: Object.keys(groupCounts),
          datasets: [
            {
              label: 'Items per Group',
              data: Object.values(groupCounts),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Item Distribution by Group',
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="div" sx={{ mb: 4 }}>
        Welcome, {user?.username}!
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4">{stats.totalItems}</Typography>
              <Typography variant="body2" color="text.secondary">Total Items</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <GroupsIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4">{stats.totalGroups}</Typography>
              <Typography variant="body2" color="text.secondary">Groups</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4">{stats.lowStockItems.length}</Typography>
              <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Items by Group</Typography>
            {chartData && <Bar data={chartData} options={chartOptions} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader title="Low Stock Alert" />
            <CardContent>
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.map((item, index) => (
                  <Paper key={index} elevation={1} sx={{ p: 1, mb: 1, bgcolor: 'error.light' }}>
                    <Typography variant="body1" color="text.primary">{item.item_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {item.quantity}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1">No low stock items!</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 