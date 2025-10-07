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
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningIcon from '@mui/icons-material/Warning';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Batch {
  id: number;
  batch_number: string;
  item_name: string;
  location_id?: number;
  quantity: number;
  manufacturing_date?: string;
  expiry_date?: string;
  received_date?: string;
  supplier_id?: number;
  cost_per_unit?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const BATCH_STATUSES = ['active', 'expired', 'recalled', 'quarantined', 'sold_out'];

const Batches: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    batch_number: '',
    item_name: '',
    location_id: '',
    quantity: '',
    manufacturing_date: '',
    expiry_date: '',
    received_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    cost_per_unit: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchItems();
    fetchLocations();
    fetchSuppliers();
  }, [statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await apiService.getBatches(filters);
      setBatches(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await apiService.getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setItems([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await apiService.getLocations(true);
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setLocations([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.getSuppliers(true);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setSuppliers([]);
    }
  };

  const handleOpenDialog = (batch?: Batch) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        batch_number: batch.batch_number,
        item_name: batch.item_name,
        location_id: batch.location_id?.toString() || '',
        quantity: batch.quantity.toString(),
        manufacturing_date: batch.manufacturing_date || '',
        expiry_date: batch.expiry_date || '',
        received_date: batch.received_date || '',
        supplier_id: batch.supplier_id?.toString() || '',
        cost_per_unit: batch.cost_per_unit?.toString() || '',
        status: batch.status,
        notes: batch.notes || ''
      });
    } else {
      setEditingBatch(null);
      setFormData({
        batch_number: '',
        item_name: '',
        location_id: '',
        quantity: '',
        manufacturing_date: '',
        expiry_date: '',
        received_date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        cost_per_unit: '',
        status: 'active',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBatch(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        received_date: formData.received_date || null
      };

      if (editingBatch) {
        await apiService.updateBatch(editingBatch.id, submitData);
        setSuccess('Batch updated successfully');
      } else {
        await apiService.createBatch(submitData);
        setSuccess('Batch created successfully');
      }
      handleCloseDialog();
      fetchBatches();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save batch');
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: 'success',
      expired: 'error',
      recalled: 'error',
      quarantined: 'warning',
      sold_out: 'default'
    };
    return colors[status] || 'default';
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
          <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Batches
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Batch
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search batches..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {BATCH_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Batch Number</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Received</TableCell>
              <TableCell>Cost/Unit</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBatches.map((batch) => (
              <TableRow
                key={batch.id}
                sx={{
                  backgroundColor: isExpired(batch.expiry_date) ? 'error.light' :
                    isExpiringSoon(batch.expiry_date) ? 'warning.light' : 'transparent'
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {batch.batch_number}
                  </Typography>
                </TableCell>
                <TableCell>{batch.item_name}</TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell>
                  {batch.expiry_date ? (
                    <Box>
                      <Typography variant="body2">
                        {new Date(batch.expiry_date).toLocaleDateString()}
                      </Typography>
                      {isExpired(batch.expiry_date) && (
                        <Chip label="EXPIRED" color="error" size="small" />
                      )}
                      {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                        <Chip
                          icon={<WarningIcon />}
                          label="Expiring Soon"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {batch.received_date ? new Date(batch.received_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  {batch.cost_per_unit ? `$${batch.cost_per_unit.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={batch.status}
                    color={getStatusColor(batch.status)}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(batch)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredBatches.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} align="center">
                  No batches found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBatch ? 'Edit Batch' : 'Add New Batch'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Batch Number"
                fullWidth
                required
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                disabled={!!editingBatch}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Item"
                select
                fullWidth
                required
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              >
                {items.map((item) => (
                  <MenuItem key={item.item_name} value={item.item_name}>
                    {item.item_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cost Per Unit"
                type="number"
                fullWidth
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                select
                fullWidth
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier"
                select
                fullWidth
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Manufacturing Date"
                type="date"
                fullWidth
                value={formData.manufacturing_date}
                onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Expiry Date"
                type="date"
                fullWidth
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Received Date"
                type="date"
                fullWidth
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Status"
                select
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {BATCH_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.batch_number || !formData.item_name || !formData.quantity}
          >
            {editingBatch ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Batches;
