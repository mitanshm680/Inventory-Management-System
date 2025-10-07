import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { apiService } from '../services/api';

interface SupplierProduct {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  item_name: string;
  supplier_sku?: string;
  unit_price: number;
  minimum_order_quantity?: number;
  lead_time_days?: number;
  is_available: boolean;
  notes?: string;
}

interface Supplier {
  id: number;
  name: string;
}

const SupplierProducts: React.FC = () => {
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [compareResults, setCompareResults] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: 0,
    item_name: '',
    supplier_sku: '',
    unit_price: 0,
    minimum_order_quantity: 1,
    lead_time_days: 7,
    is_available: true,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch suppliers
      const suppliersData = await apiService.getSuppliers(true);
      const suppliersList = suppliersData.suppliers || suppliersData;
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);

      // Fetch items
      const inventoryData = await apiService.getInventory();
      if (Array.isArray(inventoryData)) {
        setItems(inventoryData.map((item: any) => item.item_name));
      } else if (typeof inventoryData === 'object') {
        setItems(Object.keys(inventoryData));
      }

      // Fetch all supplier products (we'll fetch from first supplier if available)
      if (suppliersList.length > 0) {
        await fetchSupplierProducts(suppliersList[0].id);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async (supplierId: number) => {
    try {
      const products = await apiService.getSupplierProducts(supplierId);
      setSupplierProducts(products);
    } catch (err: any) {
      console.error('Failed to fetch supplier products:', err);
      setSupplierProducts([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      supplier_id: suppliers.length > 0 ? suppliers[0].id : 0,
      item_name: items.length > 0 ? items[0] : '',
      supplier_sku: '',
      unit_price: 0,
      minimum_order_quantity: 1,
      lead_time_days: 7,
      is_available: true,
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      await apiService.createSupplierProduct(formData);
      setSuccess('Supplier product added successfully!');
      handleCloseDialog();
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add supplier product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier product?')) {
      return;
    }

    try {
      await apiService.deleteSupplierProduct(id);
      setSuccess('Supplier product deleted successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete supplier product');
    }
  };

  const handleCompareItem = async (itemName: string) => {
    try {
      setSelectedItem(itemName);
      const results = await apiService.getItemSuppliers(itemName);
      setCompareResults(results);
      setCompareDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compare suppliers');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Supplier Products
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Supplier Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Filter by Supplier</InputLabel>
            <Select
              label="Filter by Supplier"
              onChange={(e) => fetchSupplierProducts(Number(e.target.value))}
              defaultValue={suppliers.length > 0 ? suppliers[0].id : ''}
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Item Name</strong></TableCell>
              <TableCell><strong>Supplier SKU</strong></TableCell>
              <TableCell><strong>Unit Price</strong></TableCell>
              <TableCell><strong>Min Order Qty</strong></TableCell>
              <TableCell><strong>Lead Time</strong></TableCell>
              <TableCell><strong>Available</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supplierProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No supplier products found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              supplierProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.item_name}</TableCell>
                  <TableCell>{product.supplier_sku || '-'}</TableCell>
                  <TableCell>${product.unit_price.toFixed(2)}</TableCell>
                  <TableCell>{product.minimum_order_quantity || 1}</TableCell>
                  <TableCell>{product.lead_time_days || '-'} days</TableCell>
                  <TableCell>
                    <Chip
                      label={product.is_available ? 'Yes' : 'No'}
                      color={product.is_available ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="info"
                      onClick={() => handleCompareItem(product.item_name)}
                      title="Compare suppliers"
                    >
                      <CompareArrowsIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(product.id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Supplier Product</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplier_id}
                label="Supplier"
                onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Item</InputLabel>
              <Select
                value={formData.item_name}
                label="Item"
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              >
                {items.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Supplier SKU"
              value={formData.supplier_sku}
              onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Unit Price"
              type="number"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Minimum Order Quantity"
              type="number"
              value={formData.minimum_order_quantity}
              onChange={(e) => setFormData({ ...formData, minimum_order_quantity: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 1 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Lead Time (days)"
              type="number"
              value={formData.lead_time_days}
              onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 0 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compare Suppliers for: {selectedItem}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Supplier</strong></TableCell>
                  <TableCell><strong>Unit Price</strong></TableCell>
                  <TableCell><strong>Min Order</strong></TableCell>
                  <TableCell><strong>Lead Time</strong></TableCell>
                  <TableCell><strong>SKU</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compareResults.map((result, index) => (
                  <TableRow key={index} sx={{ backgroundColor: index === 0 ? 'success.light' : 'inherit' }}>
                    <TableCell>
                      {result.supplier_name}
                      {index === 0 && <Chip label="Best Price" color="success" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell><strong>${result.unit_price.toFixed(2)}</strong></TableCell>
                    <TableCell>{result.minimum_order_quantity || 1}</TableCell>
                    <TableCell>{result.lead_time_days || '-'} days</TableCell>
                    <TableCell>{result.supplier_sku || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierProducts;
