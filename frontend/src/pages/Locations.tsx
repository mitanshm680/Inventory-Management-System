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
  Chip,
  Alert,
  CircularProgress,
  Grid,
  MenuItem,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  location_type?: string;
  capacity?: number;
  current_utilization?: number;
  manager_name?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const LOCATION_TYPES = ['warehouse', 'store', 'storage', 'distribution', 'other'];

const Locations: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    location_type: 'warehouse',
    capacity: '',
    current_utilization: '0',
    manager_name: '',
    contact_phone: '',
    contact_email: '',
    is_active: 1,
    notes: ''
  });

  useEffect(() => {
    fetchLocations();
  }, [showActiveOnly]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLocations(showActiveOnly);
      // Handle response format - API returns {locations: [...]}
      const locationsList = data.locations || data;
      setLocations(Array.isArray(locationsList) ? locationsList : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || '',
        country: location.country || 'USA',
        location_type: location.location_type || 'warehouse',
        capacity: location.capacity?.toString() || '',
        current_utilization: location.current_utilization?.toString() || '0',
        manager_name: location.manager_name || '',
        contact_phone: location.contact_phone || '',
        contact_email: location.contact_email || '',
        is_active: location.is_active,
        notes: location.notes || ''
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        location_type: 'warehouse',
        capacity: '',
        current_utilization: '0',
        manager_name: '',
        contact_phone: '',
        contact_email: '',
        is_active: 1,
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        current_utilization: formData.current_utilization ? parseInt(formData.current_utilization) : 0
      };

      if (editingLocation) {
        await apiService.updateLocation(editingLocation.id, submitData);
        setSuccess('Location updated successfully');
      } else {
        await apiService.createLocation(submitData);
        setSuccess('Location created successfully');
      }
      handleCloseDialog();
      fetchLocations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save location');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;

    try {
      await apiService.deleteLocation(id);
      setSuccess('Location deleted successfully');
      fetchLocations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete location');
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const getUtilizationPercentage = (location: Location) => {
    if (!location.capacity || location.capacity === 0) return 0;
    return ((location.current_utilization || 0) / location.capacity) * 100;
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarehouseIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Locations
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Location
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search locations..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant={showActiveOnly ? 'contained' : 'outlined'}
            onClick={() => setShowActiveOnly(!showActiveOnly)}
          >
            {showActiveOnly ? 'Active Only' : 'Show All'}
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {location.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={location.location_type || 'warehouse'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {location.city && location.state ?
                    `${location.city}, ${location.state}` :
                    location.city || location.state || '-'
                  }
                </TableCell>
                <TableCell>{location.manager_name || '-'}</TableCell>
                <TableCell>
                  {location.contact_phone && (
                    <Typography variant="caption" display="block">
                      {location.contact_phone}
                    </Typography>
                  )}
                  {location.contact_email && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {location.contact_email}
                    </Typography>
                  )}
                  {!location.contact_phone && !location.contact_email && '-'}
                </TableCell>
                <TableCell>
                  {location.capacity ? (
                    <Box sx={{ width: 120 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">
                          {location.current_utilization || 0}/{location.capacity}
                        </Typography>
                        <Typography variant="caption">
                          {getUtilizationPercentage(location).toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(getUtilizationPercentage(location), 100)}
                        color={getUtilizationPercentage(location) > 90 ? 'error' : 'primary'}
                      />
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={location.is_active ? 'Active' : 'Inactive'}
                    color={location.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(location)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(location.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredLocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} align="center">
                  No locations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Type"
                select
                fullWidth
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
              >
                {LOCATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="State"
                fullWidth
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Zip Code"
                fullWidth
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                fullWidth
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Manager Name"
                fullWidth
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Phone"
                fullWidth
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Email"
                type="email"
                fullWidth
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacity"
                type="number"
                fullWidth
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                helperText="Maximum storage capacity"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Current Utilization"
                type="number"
                fullWidth
                value={formData.current_utilization}
                onChange={(e) => setFormData({ ...formData, current_utilization: e.target.value })}
                helperText="Current usage"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={formData.is_active ? 'Active' : 'Inactive'}
                  color={formData.is_active ? 'success' : 'default'}
                  onClick={() => setFormData({ ...formData, is_active: formData.is_active ? 0 : 1 })}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>
            {editingLocation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Locations;
