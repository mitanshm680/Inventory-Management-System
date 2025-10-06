import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Divider,
  Stack,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import CategoryIcon from '@mui/icons-material/Category';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChartData, InventoryItem } from '../types';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface DashboardStats {
  totalItems: number;
  totalGroups: number;
  lowStockItems: InventoryItem[];
  recentItems: InventoryItem[];
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalGroups: 0,
    lowStockItems: [],
    recentItems: []
  });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get all inventory items
        const inventory = await apiService.getInventory();

        // Get all groups - API returns {groups: [...]}
        const groupsResponse = await apiService.getGroups();
        const groups = groupsResponse.groups || [];

        // Calculate low stock items (less than reorder point)
        const lowStock = inventory.filter((item: InventoryItem) =>
          item.quantity < (item.reorder_point || 10));

        // Get recently added items (last 5)
        const sortedInventory = [...inventory].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        const recentItems = sortedInventory.slice(0, 5);

        setStats({
          totalItems: inventory.length,
          totalGroups: groups.length,
          lowStockItems: lowStock,
          recentItems
        });
        
        // Prepare data for chart
        const categoryMap: Record<string, number> = {};
        inventory.forEach((item: InventoryItem) => {
          const category = item.category || 'Uncategorized';
          if (!categoryMap[category]) {
            categoryMap[category] = 0;
          }
          categoryMap[category]++;
        });
        
        // Sort categories by count
        const sortedCategories = Object.keys(categoryMap).sort(
          (a, b) => categoryMap[b] - categoryMap[a]
        );
        
        // Get top 5 categories
        const topCategories = sortedCategories.slice(0, 5);
        const topCategoryCounts = topCategories.map(cat => categoryMap[cat]);
        
        // Generate colors for chart
        const backgroundColors = [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ];
        
        setChartData({
          labels: topCategories,
          datasets: [
            {
              label: 'Items per Category',
              data: topCategoryCounts,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 5 Categories',
        font: {
          size: 16
        }
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.name || user?.username}!
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: 'primary.light', 
                  width: 48, 
                  height: 48,
                  mr: 2
                }}
              >
                <InventoryIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {stats.totalItems}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: 'success.light', 
                  width: 48, 
                  height: 48,
                  mr: 2
                }}
              >
                <CategoryIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Total Categories
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {chartData?.labels.length || 0}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: 'secondary.light', 
                  width: 48, 
                  height: 48,
                  mr: 2
                }}
              >
                <GroupsIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Total Groups
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {stats.totalGroups}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{ 
                  bgcolor: 'error.light', 
                  width: 48, 
                  height: 48,
                  mr: 2
                }}
              >
                <WarningIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Low Stock Items
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {stats.lowStockItems.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Inventory by Category
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 350 }}>
              {chartData && <Bar data={chartData} options={chartOptions} />}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Low Stock Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats.lowStockItems.length > 0 ? (
              <Stack spacing={2}>
                {stats.lowStockItems.slice(0, 5).map((item, index) => (
                  <Paper 
                    key={index} 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'error.light', 
                      color: 'error.contrastText',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="subtitle2">{item.name || item.item_name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">
                        In Stock: {item.quantity}
                      </Typography>
                      <Typography variant="body2">
                        Reorder: {item.reorder_point || 0}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
                {stats.lowStockItems.length > 5 && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    + {stats.lowStockItems.length - 5} more items
                  </Typography>
                )}
              </Stack>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1">All items are well stocked!</Typography>
              </Box>
            )}
          </Paper>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              mt: 3,
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Recently Added
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {stats.recentItems.length > 0 ? (
              <Stack spacing={2}>
                {stats.recentItems.map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.light',
                          width: 32,
                          height: 32, 
                          mr: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {(item.name || item.item_name || 'I').charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{item.name || item.item_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${item.quantity} in stock`}
                      size="small" 
                      color={item.quantity > (item.reorder_point || 10) ? "success" : "error"}
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1">No items added recently</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 