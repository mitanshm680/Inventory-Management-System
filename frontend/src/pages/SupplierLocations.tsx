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
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { apiService } from '../services/api';

interface SupplierLocation {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  location_id: number;
  location_name?: string;
  distance_km?: number;
  estimated_delivery_days?: number;
  shipping_cost?: number;
  is_preferred: boolean;
  notes?: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

const SupplierLocations: React.FC = () => {
  const [supplierLocations, setSupplierLocations] = useState<SupplierLocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'supplier' | 'location'>('supplier');
  const [selectedId, setSelectedId] = useState<number>(0);

  const [formData, setFormData] = useState({
    supplier_id: 0,
    location_id: 0,
    distance_km: 0,
    estimated_delivery_days: 1,
    shipping_cost: 0,
    is_preferred: false,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId > 0) {
      if (viewMode === 'supplier') {
        fetchSupplierLocations(selectedId);
      } else {
        fetchLocationSuppliers(selectedId);
      }
    }
  }, [selectedId, viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch suppliers
      const suppliersData = await apiService.getSuppliers(true);
      const suppliersList = suppliersData.suppliers || suppliersData;
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);

      // Fetch locations
      const locationsData = await apiService.getLocations(true);
      const locationsList = locationsData.locations || locationsData;
      setLocations(Array.isArray(locationsList) ? locationsList : []);

      // Set default selection
      if (viewMode === 'supplier' && suppliersList.length > 0) {
        setSelectedId(suppliersList[0].id);
        await fetchSupplierLocations(suppliersList[0].id);
      } else if (locationsList.length > 0) {
        setSelectedId(locationsList[0].id);
        await fetchLocationSuppliers(locationsList[0].id);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierLocations = async (supplierId: number) => {
    try {
      const locations = await apiService.getSupplierLocations(supplierId);
      setSupplierLocations(locations);
    } catch (err: any) {
      console.error('Failed to fetch supplier locations:', err);
      setSupplierLocations([]);
    }
  };

  const fetchLocationSuppliers = async (locationId: number) => {
    try {
      const suppliers = await apiService.getLocationSuppliers(locationId);
      setSupplierLocations(suppliers);
    } catch (err: any) {
      console.error('Failed to fetch location suppliers:', err);
      setSupplierLocations([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      supplier_id: suppliers.length > 0 ? suppliers[0].id : 0,
      location_id: locations.length > 0 ? locations[0].id : 0,
      distance_km: 0,
      estimated_delivery_days: 1,
      shipping_cost: 0,
      is_preferred: false,
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
      await apiService.createSupplierLocation(formData);
      setSuccess('Supplier location added successfully!');
      handleCloseDialog();
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add supplier location');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier-location relationship?')) {
      return;
    }

    try {
      await apiService.deleteSupplierLocation(id);
      setSuccess('Supplier location deleted successfully!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete supplier location');
    }
  };

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'supplier' | 'location') => {
    setViewMode(newValue);
    setSupplierLocations([]);
    if (newValue === 'supplier' && suppliers.length > 0) {
      setSelectedId(suppliers[0].id);
    } else if (locations.length > 0) {
      setSelectedId(locations[0].id);
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
          Supplier Locations & Shipping
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Supplier-Location Link
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

      <Paper sx={{ mb: 2 }}>
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          <Tab
            label="By Supplier"
            value="supplier"
            icon={<LocalShippingIcon />}
            iconPosition="start"
          />
          <Tab
            label="By Location"
            value="location"
            icon={<WarehouseIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>
              {viewMode === 'supplier' ? 'Select Supplier' : 'Select Location'}
            </InputLabel>
            <Select
              value={selectedId}
              label={viewMode === 'supplier' ? 'Select Supplier' : 'Select Location'}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {viewMode === 'supplier' ? (
                suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))
              ) : (
                locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>{viewMode === 'supplier' ? 'Location' : 'Supplier'}</strong></TableCell>
              <TableCell><strong>Distance (km)</strong></TableCell>
              <TableCell><strong>Shipping Cost</strong></TableCell>
              <TableCell><strong>Delivery Time</strong></TableCell>
              <TableCell><strong>Preferred</strong></TableCell>
              <TableCell><strong>Notes</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supplierLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No supplier-location relationships found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              supplierLocations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {viewMode === 'supplier' ? item.location_name : item.supplier_name}
                  </TableCell>
                  <TableCell>{item.distance_km?.toFixed(1) || '-'} km</TableCell>
                  <TableCell>${item.shipping_cost?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{item.estimated_delivery_days || '-'} days</TableCell>
                  <TableCell>
                    <Chip
                      label={item.is_preferred ? 'Yes' : 'No'}
                      color={item.is_preferred ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.notes || '-'}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(item.id)}
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
        <DialogTitle>Add Supplier-Location Relationship</DialogTitle>
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
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location_id}
                label="Location"
                onChange={(e) => setFormData({ ...formData, location_id: Number(e.target.value) })}
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Distance (km)"
              type="number"
              value={formData.distance_km}
              onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Shipping Cost ($)"
              type="number"
              value={formData.shipping_cost}
              onChange={(e) => setFormData({ ...formData, shipping_cost: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Estimated Delivery Days"
              type="number"
              value={formData.estimated_delivery_days}
              onChange={(e) => setFormData({ ...formData, estimated_delivery_days: Number(e.target.value) })}
              InputProps={{ inputProps: { min: 1 } }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Preferred Supplier?</InputLabel>
              <Select
                value={formData.is_preferred ? 1 : 0}
                label="Preferred Supplier?"
                onChange={(e) => setFormData({ ...formData, is_preferred: e.target.value === 1 })}
              >
                <MenuItem value={0}>No</MenuItem>
                <MenuItem value={1}>Yes</MenuItem>
              </Select>
            </FormControl>

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
    </Container>
  );
};

export default SupplierLocations;
