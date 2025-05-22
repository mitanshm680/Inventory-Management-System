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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Tabs,
  Tab,
  useTheme,
  Divider,
  Stack,
  FormControlLabel,
  Radio,
  RadioGroup,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';

const Prices = ({ user }) => {
  const theme = useTheme();
  const [prices, setPrices] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [newPrice, setNewPrice] = useState({
    price: 0,
    supplier: ''
  });
  const [currentPrice, setCurrentPrice] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [priceStats, setPriceStats] = useState(null);
  const [priceType, setPriceType] = useState('unit'); // Default to unit price
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Check if user has edit permissions
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');
  const canDelete = user && user.role === 'admin';

  useEffect(() => {
    fetchPrices();
    fetchInventory();
    fetchGroups();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/prices');
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchPriceHistory = async (itemName) => {
    try {
      const response = await api.get(`/prices/${itemName}/history`);
      setPriceHistory(response.data);
    } catch (error) {
      console.error('Error fetching price history:', error);
      setError('Failed to load price history');
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const groups = response.data.groups || [];
      // Group items by their group
      const grouped = getInventoryItemsWithPrices().reduce((acc, item) => {
        const group = item.group || 'Ungrouped';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      }, {});
      setGroupedItems(grouped);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleItemSelect = async (event) => {
    const itemName = event.target.value;
    setSelectedItem(itemName);
    
    if (itemName) {
      try {
        const response = await api.get(`/prices/${itemName}`);
        setSelectedItemData(response.data);
      } catch (error) {
        console.error('Error fetching item price:', error);
        setSelectedItemData(null);
      }
    } else {
      setSelectedItemData(null);
    }
  };

  const handleAddPrice = async () => {
    try {
      const priceData = {
        price: priceType === 'unit' ? parseFloat(newPrice.price) : parseFloat(newPrice.price) / selectedItemData.quantity,
        supplier: newPrice.supplier,
        is_unit_price: true // Always store as unit price
      };
      
      await api.put(`/prices/${selectedItem}`, priceData);
      setOpenAddDialog(false);
      resetForm();
      fetchPrices();
      if (selectedItem) {
        const response = await api.get(`/prices/${selectedItem}`);
        setSelectedItemData(response.data);
      }
    } catch (error) {
      console.error('Error adding price:', error);
      setError('Failed to add price');
    }
  };

  const handleEditPrice = async () => {
    try {
      await api.put(`/prices/${currentPrice.item_name}`, {
        price: currentPrice.price,
        supplier: currentPrice.supplier
      });
      setOpenEditDialog(false);
      fetchPrices();
      if (selectedItem) {
        const response = await api.get(`/prices/${selectedItem}`);
        setSelectedItemData(response.data);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      setError('Failed to update price');
    }
  };

  const handleDeletePrice = async () => {
    const supplier = currentPrice.supplier ? `?supplier=${currentPrice.supplier}` : '';
    try {
      await api.delete(`/prices/${currentPrice.item_name}${supplier}`);
      setOpenDeleteDialog(false);
      fetchPrices();
      if (selectedItem) {
        try {
          const response = await api.get(`/prices/${selectedItem}`);
          setSelectedItemData(response.data);
        } catch (error) {
          setSelectedItemData(null);
        }
      }
    } catch (error) {
      console.error('Error deleting price:', error);
      setError('Failed to delete price');
    }
  };

  const handleViewHistory = (itemName) => {
    fetchPriceHistory(itemName);
    setOpenHistoryDialog(true);
  };

  const resetForm = () => {
    setNewPrice({
      price: 0,
      supplier: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getInventoryItemsWithPrices = () => {
    return items.map(item => {
      const itemPrice = prices[item.item_name];
      const latestPrice = itemPrice && itemPrice.length > 0 ? itemPrice[0] : null;
      
      return {
        ...item,
        price: latestPrice ? latestPrice.price : null,
        supplier: latestPrice ? latestPrice.supplier : null
      };
    });
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderPriceList = () => (
    <>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Search Items"
            variant="outlined"
            size="small"
            sx={{ width: '240px' }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Group"
            >
              <MenuItem value="all">All Groups</MenuItem>
              {Object.keys(groupedItems).map(group => (
                <MenuItem key={group} value={group}>{group}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Price
          </Button>
        )}
      </Box>

      {Object.entries(groupedItems)
        .filter(([group]) => selectedGroup === 'all' || selectedGroup === group)
        .map(([group, items]) => (
          <Card key={group} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">{group}</Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Total Value</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.item_name}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>
                          {item.price !== null ? (
                            <Typography 
                              sx={{ 
                                fontWeight: 'medium', 
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {formatCurrency(item.price)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not set
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.price !== null ? (
                            <Typography fontWeight="medium">
                              {formatCurrency(item.price * item.quantity)}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {item.supplier ? (
                            <Chip 
                              label={item.supplier} 
                              size="small" 
                              variant="outlined"
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip title="View Price History">
                              <IconButton onClick={() => handleViewHistory(item.item_name)}>
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Edit Price">
                                <IconButton 
                                  color="primary"
                                  onClick={() => {
                                    setCurrentPrice({
                                      ...item,
                                      price: item.price || 0,
                                      supplier: item.supplier || ''
                                    });
                                    setOpenEditDialog(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
    </>
  );

  const renderPriceDashboard = () => (
    <Grid container spacing={3}>
      {priceStats && (
        <>
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Price Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Items
                      </Typography>
                      <Typography variant="h6">
                        {priceStats.totalItems}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Items with Prices
                      </Typography>
                      <Typography variant="h6">
                        {priceStats.itemsWithPrices}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Price
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(priceStats.averagePrice)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(priceStats.totalValue)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                  Price Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">
                          Lowest Price Item
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {priceStats.lowestPrice.item || 'N/A'}
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {priceStats.lowestPrice.item ? 
                            formatCurrency(priceStats.lowestPrice.price) : '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">
                          Highest Price Item
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {priceStats.highestPrice.item || 'N/A'}
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {priceStats.highestPrice.item ? 
                            formatCurrency(priceStats.highestPrice.price) : '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pricing Coverage
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px'
                }}>
                  <Typography variant="h3" fontWeight="bold" color={
                    priceStats.itemsWithPrices / priceStats.totalItems >= 0.8 
                      ? 'success.main' 
                      : priceStats.itemsWithPrices / priceStats.totalItems >= 0.5
                        ? 'warning.main'
                        : 'error.main'
                  }>
                    {Math.round((priceStats.itemsWithPrices / priceStats.totalItems) * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Items with price information
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    Price Tracking Status
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Chip 
                        label={`${priceStats.itemsWithPrices} with prices`} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip 
                        label={`${priceStats.totalItems - priceStats.itemsWithPrices} without prices`}
                        color="default"
                        variant="outlined"
                        size="small"
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Value Items
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getInventoryItemsWithPrices()
                    .filter(item => item.price !== null)
                    .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                    .slice(0, 5)
                    .map(item => (
                      <TableRow key={item.item_name}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Price Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage item prices, track price history, and analyze pricing trends
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Price List" icon={<AttachMoneyIcon />} iconPosition="start" />
          <Tab label="Price Analytics" icon={<CompareArrowsIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {activeTab === 0 ? renderPriceList() : renderPriceDashboard()}

      {/* Add Price Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add Price</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '400px', maxWidth: '100%', mt: 1 }}>
            <TextField
              label="Select Item"
              select
              fullWidth
              margin="normal"
              value={selectedItem}
              onChange={handleItemSelect}
            >
              {items.map((item) => (
                <MenuItem key={item.item_name} value={item.item_name}>
                  {item.item_name}
                </MenuItem>
              ))}
            </TextField>
            
            <Box sx={{ my: 2 }}>
              <RadioGroup
                row
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <FormControlLabel value="unit" control={<Radio />} label="Unit Price" />
                <FormControlLabel value="total" control={<Radio />} label="Total Price" />
              </RadioGroup>
            </Box>

            <TextField
              label={priceType === 'unit' ? 'Price per Unit' : 'Total Price'}
              type="number"
              fullWidth
              margin="normal"
              value={newPrice.price}
              onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText={
                selectedItemData && priceType === 'unit' 
                  ? `Total Value: ${formatCurrency(newPrice.price * selectedItemData.quantity)}`
                  : selectedItemData && priceType === 'total' && selectedItemData.quantity > 0
                    ? `Price per Unit: ${formatCurrency(newPrice.price / selectedItemData.quantity)}`
                    : ''
              }
            />
            
            <TextField
              label="Supplier (optional)"
              fullWidth
              margin="normal"
              value={newPrice.supplier}
              onChange={(e) => setNewPrice({ ...newPrice, supplier: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPrice} 
            variant="contained" 
            color="primary"
            disabled={!selectedItem || !newPrice.price}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Price for {currentPrice?.item_name}</DialogTitle>
        <DialogContent>
          <Box sx={{ width: '400px', maxWidth: '100%', mt: 1 }}>
            <TextField
              label="Price"
              type="number"
              fullWidth
              margin="normal"
              value={currentPrice?.price || 0}
              onChange={(e) => setCurrentPrice({ ...currentPrice, price: parseFloat(e.target.value) })}
            />
            <TextField
              label="Supplier (optional)"
              fullWidth
              margin="normal"
              value={currentPrice?.supplier || ''}
              onChange={(e) => setCurrentPrice({ ...currentPrice, supplier: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditPrice} 
            variant="contained" 
            color="primary"
            disabled={!currentPrice?.price}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog 
        open={openHistoryDialog} 
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Price History for {selectedItem}</DialogTitle>
        <DialogContent>
          {priceHistory.length > 0 ? (
            <Box sx={{ height: '300px', mt: 2 }}>
              <Line
                data={{
                  labels: priceHistory.map(entry => new Date(entry.timestamp).toLocaleDateString()),
                  datasets: [
                    {
                      label: 'Price History',
                      data: priceHistory.map(entry => entry.price),
                      fill: false,
                      borderColor: theme.palette.primary.main,
                      tension: 0.1,
                      pointBackgroundColor: theme.palette.primary.main,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: 'Price ($)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    }
                  }
                }}
              />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ my: 2 }}>
              No price history available for this item.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Prices; 