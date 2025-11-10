import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Rating,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  website?: string;
  notes?: string;
  rating?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

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

interface Location {
  id: number;
  name: string;
}

const Suppliers: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [supplierLocations, setSupplierLocations] = useState<SupplierLocation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Supplier management
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly] = useState(true);

  // Product management
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState<number>(0);

  // Location management
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedSupplierForLocations, setSelectedSupplierForLocations] = useState<number>(0);

  // Quick location creation
  const [createLocationDialogOpen, setCreateLocationDialogOpen] = useState(false);
  const [newLocationFormData, setNewLocationFormData] = useState({
    name: '',
    location_type: 'warehouse',
    city: '',
    state: '',
    country: 'USA'
  });

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    website: '',
    notes: '',
    rating: 0,
    is_active: 1
  });

  const [productFormData, setProductFormData] = useState({
    supplier_id: 0,
    item_name: '',
    supplier_sku: '',
    unit_price: 0,
    minimum_order_quantity: 1,
    lead_time_days: 7,
    is_available: true,
    notes: ''
  });

  const [locationFormData, setLocationFormData] = useState({
    supplier_id: 0,
    location_id: 0,
    distance_km: 0,
    estimated_delivery_days: 1,
    shipping_cost: 0,
    is_preferred: false,
    notes: ''
  });

  const fetchSupplierProducts = async (supplierId: number) => {
    try {
      const products = await apiService.getSupplierProducts(supplierId);
      setSupplierProducts(products);
    } catch (err) {
      console.error('Failed to fetch supplier products:', err);
      setSupplierProducts([]);
    }
  };

  const fetchSupplierLocations = async (supplierId: number) => {
    try {
      const locations = await apiService.getSupplierLocations(supplierId);
      setSupplierLocations(locations);
    } catch (err) {
      console.error('Failed to fetch supplier locations:', err);
      setSupplierLocations([]);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch suppliers
      const supplierData = await apiService.getSuppliers(showActiveOnly);
      const suppliersList = supplierData.suppliers || supplierData;
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);

      if (currentTab === 1 && suppliersList.length > 0) {
        // Fetch products for first supplier
        const firstSupplierId = suppliersList[0].id;
        setSelectedSupplierForProducts(firstSupplierId);
        await fetchSupplierProducts(firstSupplierId);

        // Fetch items for dropdown
        const inventoryData = await apiService.getInventory();
        if (Array.isArray(inventoryData)) {
          setItems(inventoryData.map((item: any) => item.item_name));
        }
      }

      if (currentTab === 2 && suppliersList.length > 0) {
        // Fetch locations for first supplier
        const firstSupplierId = suppliersList[0].id;
        setSelectedSupplierForLocations(firstSupplierId);
        await fetchSupplierLocations(firstSupplierId);

        // Fetch all locations
        const locationsData = await apiService.getLocations(true);
        const locationsList = locationsData.locations || locationsData;
        setLocations(Array.isArray(locationsList) ? locationsList : []);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, showActiveOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Supplier handlers
  const handleOpenSupplierDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zip_code: supplier.zip_code || '',
        country: supplier.country || 'USA',
        website: supplier.website || '',
        notes: supplier.notes || '',
        rating: supplier.rating || 0,
        is_active: supplier.is_active
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        website: '',
        notes: '',
        rating: 0,
        is_active: 1
      });
    }
    setSupplierDialogOpen(true);
  };

  const handleSubmitSupplier = async () => {
    try {
      if (editingSupplier) {
        await apiService.updateSupplier(editingSupplier.id, supplierFormData);
        setSuccess('Supplier updated successfully');
      } else {
        await apiService.createSupplier(supplierFormData);
        setSuccess('Supplier created successfully');
      }
      setSupplierDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await apiService.deleteSupplier(id);
      setSuccess('Supplier deleted successfully');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete supplier');
    }
  };

  // Product handlers
  const handleOpenProductDialog = () => {
    setProductFormData({
      supplier_id: selectedSupplierForProducts || (suppliers.length > 0 ? suppliers[0].id : 0),
      item_name: items.length > 0 ? items[0] : '',
      supplier_sku: '',
      unit_price: 0,
      minimum_order_quantity: 1,
      lead_time_days: 7,
      is_available: true,
      notes: ''
    });
    setProductDialogOpen(true);
  };

  const handleSubmitProduct = async () => {
    try {
      await apiService.createSupplierProduct(productFormData);
      setSuccess('Product added successfully');
      setProductDialogOpen(false);
      fetchSupplierProducts(selectedSupplierForProducts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await apiService.deleteSupplierProduct(id);
      setSuccess('Product deleted successfully');
      fetchSupplierProducts(selectedSupplierForProducts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  // Location handlers
  const handleOpenLocationDialog = () => {
    setLocationFormData({
      supplier_id: selectedSupplierForLocations || (suppliers.length > 0 ? suppliers[0].id : 0),
      location_id: locations.length > 0 ? locations[0].id : 0,
      distance_km: 0,
      estimated_delivery_days: 1,
      shipping_cost: 0,
      is_preferred: false,
      notes: ''
    });
    setLocationDialogOpen(true);
  };

  const handleSubmitLocation = async () => {
    try {
      await apiService.createSupplierLocation(locationFormData);
      setSuccess('Location link added successfully');
      setLocationDialogOpen(false);
      fetchSupplierLocations(selectedSupplierForLocations);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add location');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this location link?')) return;

    try {
      await apiService.deleteSupplierLocation(id);
      setSuccess('Location link deleted successfully');
      fetchSupplierLocations(selectedSupplierForLocations);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete location link');
    }
  };

  const handleCreateNewLocation = async () => {
    if (!newLocationFormData.name.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      await apiService.createLocation({
        ...newLocationFormData,
        is_active: 1,
        capacity: 1000
      });
      setSuccess(`Location "${newLocationFormData.name}" created successfully`);
      setCreateLocationDialogOpen(false);
      setNewLocationFormData({
        name: '',
        location_type: 'warehouse',
        city: '',
        state: '',
        country: 'USA'
      });

      // Refresh locations list
      const locationsData = await apiService.getLocations(true);
      const locationsList = locationsData.locations || locationsData;
      setLocations(Array.isArray(locationsList) ? locationsList : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create location');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Supplier Management
        </Typography>
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
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab
            label="Suppliers"
            icon={<LocalShippingIcon />}
            iconPosition="start"
          />
          <Tab
            label="Products & Pricing"
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab
            label="Delivery & Shipping"
            icon={<LocationOnIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab 1: Suppliers */}
      {currentTab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenSupplierDialog()}
                  >
                    Add Supplier
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Contact Person</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Rating</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {supplier.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>{supplier.city && supplier.state ? `${supplier.city}, ${supplier.state}` : '-'}</TableCell>
                      <TableCell>
                        <Rating value={supplier.rating || 0} readOnly size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={supplier.is_active ? 'Active' : 'Inactive'}
                          color={supplier.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenSupplierDialog(supplier)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          {user?.role === 'admin' && (
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 8 : 7} align="center">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 2: Products & Pricing */}
      {currentTab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Supplier</InputLabel>
                  <Select
                    value={selectedSupplierForProducts}
                    label="Select Supplier"
                    onChange={(e) => {
                      const supplierId = Number(e.target.value);
                      setSelectedSupplierForProducts(supplierId);
                      fetchSupplierProducts(supplierId);
                    }}
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenProductDialog}
                  >
                    Add Product
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Item Name</strong></TableCell>
                  <TableCell><strong>Supplier SKU</strong></TableCell>
                  <TableCell align="right"><strong>Unit Price</strong></TableCell>
                  <TableCell align="right"><strong>Min Order</strong></TableCell>
                  <TableCell align="right"><strong>Lead Time</strong></TableCell>
                  <TableCell><strong>Available</strong></TableCell>
                  {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierProducts.length > 0 ? (
                  supplierProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.item_name}</TableCell>
                      <TableCell>{product.supplier_sku || '-'}</TableCell>
                      <TableCell align="right">${product.unit_price.toFixed(2)}</TableCell>
                      <TableCell align="right">{product.minimum_order_quantity || 1}</TableCell>
                      <TableCell align="right">{product.lead_time_days || '-'} days</TableCell>
                      <TableCell>
                        <Chip
                          label={product.is_available ? 'Yes' : 'No'}
                          color={product.is_available ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteProduct(product.id)}
                            size="small"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} align="center">
                      No products found for this supplier
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 3: Delivery & Shipping */}
      {currentTab === 2 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Supplier</InputLabel>
                  <Select
                    value={selectedSupplierForLocations}
                    label="Select Supplier"
                    onChange={(e) => {
                      const supplierId = Number(e.target.value);
                      setSelectedSupplierForLocations(supplierId);
                      fetchSupplierLocations(supplierId);
                    }}
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'right', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {canEdit && (
                  <>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<LocationOnIcon />}
                      onClick={() => setCreateLocationDialogOpen(true)}
                    >
                      Create Location
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenLocationDialog}
                    >
                      Add Location Link
                    </Button>
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell align="right"><strong>Distance (km)</strong></TableCell>
                  <TableCell align="right"><strong>Shipping Cost</strong></TableCell>
                  <TableCell align="right"><strong>Delivery Time</strong></TableCell>
                  <TableCell><strong>Preferred</strong></TableCell>
                  {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierLocations.length > 0 ? (
                  supplierLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.location_name}</TableCell>
                      <TableCell align="right">{location.distance_km?.toFixed(1) || '-'} km</TableCell>
                      <TableCell align="right">${location.shipping_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell align="right">{location.estimated_delivery_days || '-'} days</TableCell>
                      <TableCell>
                        <Chip
                          label={location.is_preferred ? 'Yes' : 'No'}
                          color={location.is_preferred ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteLocation(location.id)}
                            size="small"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} align="center">
                      No location links found for this supplier
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Supplier Dialog */}
      <Dialog open={supplierDialogOpen} onClose={() => setSupplierDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={supplierFormData.contact_person}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={supplierFormData.email}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={supplierFormData.phone}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={supplierFormData.city}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={supplierFormData.state}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={supplierFormData.zip_code}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, zip_code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={supplierFormData.website}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, website: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography component="legend">Rating</Typography>
                  <Rating
                    value={supplierFormData.rating}
                    onChange={(e, value) => setSupplierFormData({ ...supplierFormData, rating: value || 0 })}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={supplierFormData.notes}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitSupplier} variant="contained" color="primary">
            {editingSupplier ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product to Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Item</InputLabel>
                  <Select
                    value={productFormData.item_name}
                    label="Item"
                    onChange={(e) => setProductFormData({ ...productFormData, item_name: e.target.value })}
                  >
                    {items.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier SKU"
                  value={productFormData.supplier_sku}
                  onChange={(e) => setProductFormData({ ...productFormData, supplier_sku: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={productFormData.unit_price}
                  onChange={(e) => setProductFormData({ ...productFormData, unit_price: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Order Quantity"
                  type="number"
                  value={productFormData.minimum_order_quantity}
                  onChange={(e) => setProductFormData({ ...productFormData, minimum_order_quantity: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lead Time (days)"
                  type="number"
                  value={productFormData.lead_time_days}
                  onChange={(e) => setProductFormData({ ...productFormData, lead_time_days: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitProduct} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Supplier to Location</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={locationFormData.location_id}
                    label="Location"
                    onChange={(e) => setLocationFormData({ ...locationFormData, location_id: Number(e.target.value) })}
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Distance (km)"
                  type="number"
                  value={locationFormData.distance_km}
                  onChange={(e) => setLocationFormData({ ...locationFormData, distance_km: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shipping Cost ($)"
                  type="number"
                  value={locationFormData.shipping_cost}
                  onChange={(e) => setLocationFormData({ ...locationFormData, shipping_cost: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Estimated Delivery Days"
                  type="number"
                  value={locationFormData.estimated_delivery_days}
                  onChange={(e) => setLocationFormData({ ...locationFormData, estimated_delivery_days: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitLocation} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog
        open={createLocationDialogOpen}
        onClose={() => setCreateLocationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Location</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Location Name"
                  value={newLocationFormData.name}
                  onChange={(e) => setNewLocationFormData({ ...newLocationFormData, name: e.target.value })}
                  placeholder="e.g. Main Warehouse"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newLocationFormData.location_type}
                    onChange={(e) => setNewLocationFormData({ ...newLocationFormData, location_type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="warehouse">Warehouse</MenuItem>
                    <MenuItem value="store">Store</MenuItem>
                    <MenuItem value="storage">Storage</MenuItem>
                    <MenuItem value="distribution">Distribution</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={newLocationFormData.city}
                  onChange={(e) => setNewLocationFormData({ ...newLocationFormData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={newLocationFormData.state}
                  onChange={(e) => setNewLocationFormData({ ...newLocationFormData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={newLocationFormData.country}
                  onChange={(e) => setNewLocationFormData({ ...newLocationFormData, country: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateLocationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNewLocation} variant="contained" color="primary">
            Create Location
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Suppliers;
