import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import SavingsIcon from '@mui/icons-material/Savings';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useAuth } from '../contexts/AuthContext';
import { InventoryItem } from '../types';
import api from '../utils/api';

interface PriceEntry {
  id: number;
  price: number;
  supplier: string;
  is_unit_price: boolean;
  date: string;
  item_name: string;
}

interface PriceHistory {
  date: string;
  price: number;
  supplier: string;
}

const Prices: React.FC = () => {
  const { user } = useAuth();
  const [prices, setPrices] = useState<Record<string, PriceEntry[]>>({});
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<string | null>(null);
  const [cheapestSuppliers, setCheapestSuppliers] = useState<Record<string, { supplier: string, price: number }>>({});

  // Form states for add/edit
  const [formData, setFormData] = useState({
    item_name: '',
    price: 0,
    supplier: '',
    is_unit_price: true
  });

  useEffect(() => {
    fetchPrices();
    fetchInventory();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prices');
      setPrices(response.data);
      
      // Get cheapest suppliers for each item
      const cheapest: Record<string, { supplier: string, price: number }> = {};
      
      // Process items one by one to avoid overwhelming the server with requests
      for (const itemName of Object.keys(response.data)) {
        try {
          const cheapestResponse = await api.get(`/prices/${itemName}/cheapest`);
          if (cheapestResponse.data && cheapestResponse.data.supplier) {
            cheapest[itemName] = {
              supplier: cheapestResponse.data.supplier,
              price: cheapestResponse.data.price
            };
          }
        } catch (err) {
          console.log(`No cheapest supplier data available for ${itemName}`);
          // Just skip items that don't have cheapest supplier data
        }
      }
      
      setCheapestSuppliers(cheapest);
      setError(null);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to load price data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
    }
  };

  const fetchPriceHistory = async (itemName: string) => {
    try {
      const response = await api.get(`/prices/${itemName}/history`);
      setPriceHistory(response.data);
      setSelectedItem(itemName);
      setHistoryDialog(true);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError(`Failed to load price history for ${itemName}`);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseFloat(value) : value
    });
  };

  const handleItemChange = (event: SelectChangeEvent) => {
    setFormData({
      ...formData,
      item_name: event.target.value
    });
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      is_unit_price: event.target.checked
    });
  };

  const handleAddClick = (itemName?: string) => {
    setFormData({
      item_name: itemName || '',
      price: 0,
      supplier: '',
      is_unit_price: true
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (itemName: string, supplier?: string) => {
    setDeleteItemName(itemName);
    setDeleteSupplier(supplier || null);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!deleteItemName) return;
    
    try {
      const endpoint = deleteSupplier
        ? `/prices/${deleteItemName}?supplier=${deleteSupplier}`
        : `/prices/${deleteItemName}`;
        
      await api.delete(endpoint);
      setSuccess(`Price ${deleteSupplier ? `for ${deleteItemName} from supplier ${deleteSupplier}` : `entries for ${deleteItemName}`} deleted`);
      fetchPrices(); // Refresh prices
    } catch (err) {
      console.error('Error deleting price:', err);
      setError('Failed to delete price. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteItemName(null);
      setDeleteSupplier(null);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleHistoryDialogClose = () => {
    setHistoryDialog(false);
    setSelectedItem(null);
    setPriceHistory([]);
  };

  const handleSubmit = async () => {
    try {
      await api.put(`/prices/${formData.item_name}`, {
        price: formData.price,
        supplier: formData.supplier,
        is_unit_price: formData.is_unit_price
      });
      
      setSuccess(`Price for ${formData.item_name} has been updated`);
      setOpenDialog(false);
      fetchPrices(); // Refresh prices
    } catch (err) {
      console.error('Error saving price:', err);
      setError('Failed to save price. Please check your input and try again.');
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  // Filter and flatten prices for display
  const flattenedPrices: Array<{
    item_name: string;
    entries: PriceEntry[];
    cheapest?: { supplier: string; price: number };
  }> = Object.keys(prices)
    .filter(itemName => itemName.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(itemName => ({
      item_name: itemName,
      entries: prices[itemName],
      cheapest: cheapestSuppliers[itemName]
    }));

  // Pagination
  const paginatedItems = flattenedPrices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Price Management
        </Typography>
        
        {/* Search and Add button */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              {canEdit && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddClick()}
                >
                  Add New Price
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Prices List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : flattenedPrices.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {paginatedItems.map((item) => (
                <Grid item xs={12} key={item.item_name}>
                  <Card elevation={1}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          {item.item_name}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {canEdit && (
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddClick(item.item_name)}
                            >
                              Add Supplier
                            </Button>
                          )}
                          <Button
                            size="small"
                            startIcon={<HistoryIcon />}
                            onClick={() => fetchPriceHistory(item.item_name)}
                          >
                            History
                          </Button>
                          {isAdmin && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteClick(item.item_name)}
                            >
                              Delete All
                            </Button>
                          )}
                        </Stack>
                      </Box>
                      
                      {item.cheapest && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SavingsIcon color="success" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="success.main">
                            Best price: {formatPrice(item.cheapest.price)} from {item.cheapest.supplier}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Supplier</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell>Price Type</TableCell>
                              <TableCell>Last Updated</TableCell>
                              {canEdit && <TableCell align="center">Actions</TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {item.entries.length > 0 ? (
                              item.entries.map((entry) => (
                                <TableRow key={`${item.item_name}-${entry.supplier}`}>
                                  <TableCell>{entry.supplier}</TableCell>
                                  <TableCell align="right">
                                    {formatPrice(entry.price)}
                                    {item.cheapest?.supplier === entry.supplier && (
                                      <Chip 
                                        label="Best Price" 
                                        color="success" 
                                        size="small" 
                                        sx={{ ml: 1 }} 
                                        variant="outlined"
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {entry.is_unit_price ? 'Per Unit' : 'Total'}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(entry.date).toLocaleDateString()}
                                  </TableCell>
                                  {isAdmin && (
                                    <TableCell align="center">
                                      <IconButton 
                                        color="error" 
                                        onClick={() => handleDeleteClick(item.item_name, entry.supplier)}
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={canEdit ? 5 : 4} align="center">
                                  No price entries found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <TablePagination
                component="div"
                count={flattenedPrices.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No price data found
            </Typography>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleAddClick()}
                sx={{ mt: 2 }}
              >
                Add First Price Entry
              </Button>
            )}
          </Paper>
        )}
      </Box>

      {/* Add/Edit Price Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formData.item_name ? `Set Price for ${formData.item_name}` : 'Add New Price Entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!!formData.item_name}>
                  <InputLabel>Item</InputLabel>
                  <Select
                    value={formData.item_name}
                    onChange={handleItemChange}
                    label="Item"
                  >
                    {items.map((item) => (
                      <MenuItem key={item.item_name} value={item.item_name}>
                        {item.item_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="supplier"
                  label="Supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="price"
                  label="Price"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_unit_price}
                      onChange={handleSwitchChange}
                      name="is_unit_price"
                    />
                  }
                  label="Price is per unit"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={!formData.item_name || !formData.supplier || formData.price <= 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialog} onClose={handleHistoryDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Price History for {selectedItem}</DialogTitle>
        <DialogContent>
          {priceHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceHistory.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.supplier}</TableCell>
                      <TableCell align="right">{formatPrice(entry.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography align="center" sx={{ p: 3 }}>
              No price history available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHistoryDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteSupplier 
              ? `Are you sure you want to delete the price entry for "${deleteItemName}" from supplier "${deleteSupplier}"?`
              : `Are you sure you want to delete ALL price entries for "${deleteItemName}"?`
            }
            <Box component="span" fontWeight="bold" display="block" mt={1}>
              This action cannot be undone.
            </Box>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleting(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Prices; 