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
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StockAdjustment {
  id: number;
  item_name: string;
  location_id?: number;
  batch_id?: number;
  adjustment_type: string;
  quantity: number;
  reason: string;
  reason_notes?: string;
  adjusted_by: string;
  approved_by?: string;
  reference_number?: string;
  adjustment_date: string;
  created_at: string;
}

const ADJUSTMENT_REASONS = [
  'damaged',
  'stolen',
  'lost',
  'expired',
  'returned',
  'found',
  'correction',
  'transfer',
  'donation',
  'sample',
  'other'
];

const StockAdjustments: React.FC = () => {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    item_name: '',
    location_id: '',
    batch_id: '',
    adjustment_type: 'increase',
    quantity: '',
    reason: 'correction',
    reason_notes: '',
    approved_by: '',
    reference_number: ''
  });

  useEffect(() => {
    fetchAdjustments();
    fetchItems();
    fetchLocations();
  }, []);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStockAdjustments();
      setAdjustments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch stock adjustments');
      setAdjustments([]);
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

  const fetchBatchesForItem = async (itemName: string) => {
    if (!itemName) return;
    try {
      const data = await apiService.getItemBatches(itemName, true);
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      item_name: '',
      location_id: '',
      batch_id: '',
      adjustment_type: 'increase',
      quantity: '',
      reason: 'correction',
      reason_notes: '',
      approved_by: '',
      reference_number: ''
    });
    setBatches([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleItemChange = (itemName: string) => {
    setFormData({ ...formData, item_name: itemName, batch_id: '' });
    fetchBatchesForItem(itemName);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
        batch_id: formData.batch_id ? parseInt(formData.batch_id) : null,
        adjusted_by: user?.username || 'unknown',
        approved_by: formData.approved_by || null,
        reference_number: formData.reference_number || null
      };

      await apiService.createStockAdjustment(submitData);
      setSuccess('Stock adjustment created successfully');
      handleCloseDialog();
      fetchAdjustments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create stock adjustment');
    }
  };

  const filteredAdjustments = adjustments.filter(adjustment =>
    adjustment.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.adjusted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase())
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
          Stock Adjustments
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            New Adjustment
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          placeholder="Search adjustments..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Adjusted By</TableCell>
              <TableCell>Approved By</TableCell>
              <TableCell>Reference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAdjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>
                  {new Date(adjustment.adjustment_date).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={adjustment.adjustment_type === 'increase' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                    label={adjustment.adjustment_type}
                    color={adjustment.adjustment_type === 'increase' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {adjustment.item_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={adjustment.adjustment_type === 'increase' ? 'success.main' : 'error.main'}
                  >
                    {adjustment.adjustment_type === 'increase' ? '+' : '-'}{adjustment.quantity}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Chip label={adjustment.reason} size="small" variant="outlined" />
                    {adjustment.reason_notes && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {adjustment.reason_notes}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{adjustment.adjusted_by}</TableCell>
                <TableCell>{adjustment.approved_by || '-'}</TableCell>
                <TableCell>{adjustment.reference_number || '-'}</TableCell>
              </TableRow>
            ))}
            {filteredAdjustments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No stock adjustments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>New Stock Adjustment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Item"
                select
                fullWidth
                required
                value={formData.item_name}
                onChange={(e) => handleItemChange(e.target.value)}
              >
                {items.map((item) => (
                  <MenuItem key={item.item_name} value={item.item_name}>
                    {item.item_name} (Current: {item.quantity})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Adjustment Type"
                select
                fullWidth
                required
                value={formData.adjustment_type}
                onChange={(e) => setFormData({ ...formData, adjustment_type: e.target.value })}
              >
                <MenuItem value="increase">Increase</MenuItem>
                <MenuItem value="decrease">Decrease</MenuItem>
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
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason"
                select
                fullWidth
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              >
                {ADJUSTMENT_REASONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason.charAt(0).toUpperCase() + reason.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.reason_notes}
                onChange={(e) => setFormData({ ...formData, reason_notes: e.target.value })}
                helperText="Provide details about this adjustment"
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
                label="Batch"
                select
                fullWidth
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                disabled={!formData.item_name}
              >
                <MenuItem value="">None</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.batch_number} ({batch.quantity} available)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Reference Number"
                fullWidth
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                helperText="PO, Invoice, or Ticket #"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Approved By"
                fullWidth
                value={formData.approved_by}
                onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                helperText="Manager or supervisor"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.item_name || !formData.quantity || !formData.reason}
          >
            Create Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockAdjustments;
