import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Divider,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { apiService } from '../services/api';
import { getErrorMessage } from '../utils/validationSchemas';

interface PurchaseOrderItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  received_quantity?: number;
  notes?: string;
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name?: string;
  location_id?: number;
  location_name?: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: string;
  total_amount: number;
  shipping_cost?: number;
  tax_amount?: number;
  notes?: string;
  created_by: string;
  items?: PurchaseOrderItem[];
}

interface Supplier {
  id: number;
  name: string;
  is_active: number;
}

interface Location {
  id: number;
  name: string;
  is_active: number;
}

interface InventoryItem {
  item_name: string;
}

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  // Create PO Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPO, setNewPO] = useState<any>({
    supplier_id: '',
    location_id: '',
    expected_delivery_date: '',
    notes: '',
    items: [{ item_name: '', quantity: 1, unit_price: 0, notes: '' }],
  });

  // View PO Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Receive PO Dialog
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPurchaseOrders(
        statusFilter || undefined,
        supplierFilter ? parseInt(supplierFilter) : undefined
      );
      setPurchaseOrders(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, supplierFilter]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [suppliersData, locationsData, itemsData] = await Promise.all([
          apiService.getSuppliers(true),
          apiService.getLocations(true),
          apiService.getInventory(),
        ]);
        setSuppliers(suppliersData);
        setLocations(locationsData);
        setInventoryItems(itemsData);
      } catch (err: any) {
        setError(getErrorMessage(err));
      }
    };
    fetchInitialData();
  }, []);

  const handleCreatePO = async () => {
    setError(null);
    setSuccess(null);

    // Validate
    if (!newPO.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    if (newPO.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    for (const item of newPO.items) {
      if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
        setError('Please fill in all item details correctly');
        return;
      }
    }

    try {
      setLoading(true);
      await apiService.createPurchaseOrder(newPO);
      setSuccess('Purchase order created successfully');
      setCreateDialogOpen(false);
      setNewPO({
        supplier_id: '',
        location_id: '',
        expected_delivery_date: '',
        notes: '',
        items: [{ item_name: '', quantity: 1, unit_price: 0, notes: '' }],
      });
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewPO({
      ...newPO,
      items: [...newPO.items, { item_name: '', quantity: 1, unit_price: 0, notes: '' }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const items = [...newPO.items];
    items.splice(index, 1);
    setNewPO({ ...newPO, items });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...newPO.items];
    items[index] = { ...items[index], [field]: value };
    setNewPO({ ...newPO, items });
  };

  const handleViewPO = async (po: PurchaseOrder) => {
    try {
      const details = await apiService.getPurchaseOrder(po.id);
      setSelectedPO(details);
      setViewDialogOpen(true);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateStatus = async (poId: number, status: string) => {
    try {
      setLoading(true);
      await apiService.updatePurchaseOrderStatus(poId, status);
      setSuccess(`Order status updated to ${status}`);
      fetchPurchaseOrders();
      if (selectedPO && selectedPO.id === poId) {
        setSelectedPO({ ...selectedPO, status });
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveDialog = (po: PurchaseOrder) => {
    if (po.items) {
      setReceiveItems(
        po.items.map((item) => ({
          item_name: item.item_name,
          ordered_quantity: item.quantity,
          received_quantity: item.received_quantity || 0,
          quantity_to_receive: item.quantity - (item.received_quantity || 0),
        }))
      );
      setSelectedPO(po);
      setReceiveDialogOpen(true);
    }
  };

  const handleReceivePO = async () => {
    if (!selectedPO) return;

    try {
      setLoading(true);
      await apiService.receivePurchaseOrder(selectedPO.id, receiveItems);
      setSuccess('Items received successfully');
      setReceiveDialogOpen(false);
      fetchPurchaseOrders();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'received':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateTotal = () => {
    return newPO.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price || 0);
    }, 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Purchase Order
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={supplierFilter}
                  label="Supplier"
                  onChange={(e: SelectChangeEvent) => setSupplierFilter(e.target.value)}
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id} hover>
                  <TableCell>{po.order_number}</TableCell>
                  <TableCell>{po.supplier_name || `Supplier ${po.supplier_id}`}</TableCell>
                  <TableCell>{po.location_name || 'N/A'}</TableCell>
                  <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {po.expected_delivery_date
                      ? new Date(po.expected_delivery_date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={po.status.toUpperCase()}
                      color={getStatusColor(po.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">${po.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewPO(po)} color="primary">
                      <VisibilityIcon />
                    </IconButton>
                    {po.status === 'shipped' && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenReceiveDialog(po)}
                        color="success"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create PO Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={newPO.supplier_id}
                    label="Supplier"
                    onChange={(e: SelectChangeEvent) =>
                      setNewPO({ ...newPO, supplier_id: e.target.value })
                    }
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Delivery Location</InputLabel>
                  <Select
                    value={newPO.location_id}
                    label="Delivery Location"
                    onChange={(e: SelectChangeEvent) =>
                      setNewPO({ ...newPO, location_id: e.target.value })
                    }
                  >
                    <MenuItem value="">None</MenuItem>
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
                  type="date"
                  label="Expected Delivery Date"
                  value={newPO.expected_delivery_date}
                  onChange={(e) => setNewPO({ ...newPO, expected_delivery_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={newPO.notes}
                  onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Order Items</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddItem} size="small">
                Add Item
              </Button>
            </Box>

            {newPO.items.map((item: any, index: number) => (
              <Accordion key={index} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Item {index + 1}: {item.item_name || '(Not selected)'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Item</InputLabel>
                        <Select
                          value={item.item_name}
                          label="Item"
                          onChange={(e: SelectChangeEvent) =>
                            handleItemChange(index, 'item_name', e.target.value)
                          }
                        >
                          {inventoryItems.map((invItem) => (
                            <MenuItem key={invItem.item_name} value={invItem.item_name}>
                              {invItem.item_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          Subtotal: ${(item.quantity * item.unit_price).toFixed(2)}
                        </Typography>
                        {newPO.items.length > 1 && (
                          <Button
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleRemoveItem(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" align="right">
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePO} variant="contained" color="primary" disabled={loading}>
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Purchase Order Details</DialogTitle>
        <DialogContent>
          {selectedPO && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1">{selectedPO.order_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedPO.status.toUpperCase()}
                    color={getStatusColor(selectedPO.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Supplier
                  </Typography>
                  <Typography variant="body1">
                    {selectedPO.supplier_name || `Supplier ${selectedPO.supplier_id}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{selectedPO.location_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedPO.order_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expected Delivery
                  </Typography>
                  <Typography variant="body1">
                    {selectedPO.expected_delivery_date
                      ? new Date(selectedPO.expected_delivery_date).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                {selectedPO.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">{selectedPO.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPO.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ${((item.total_price || (item.quantity * item.unit_price))).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" align="right">
                  Total: ${selectedPO.total_amount.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedPO.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleUpdateStatus(selectedPO.id, 'confirmed')}
                    >
                      Confirm Order
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleUpdateStatus(selectedPO.id, 'cancelled')}
                    >
                      Cancel Order
                    </Button>
                  </>
                )}
                {selectedPO.status === 'confirmed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocalShippingIcon />}
                    onClick={() => handleUpdateStatus(selectedPO.id, 'shipped')}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {selectedPO.status === 'shipped' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleOpenReceiveDialog(selectedPO)}
                  >
                    Receive Items
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Receive PO Dialog */}
      <Dialog open={receiveDialogOpen} onClose={() => setReceiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Receive Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Enter the quantities received for each item:
            </Typography>
            {receiveItems.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="subtitle2">{item.item_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ordered: {item.ordered_quantity} | Already Received: {item.received_quantity}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity to Receive"
                  value={item.quantity_to_receive}
                  onChange={(e) => {
                    const items = [...receiveItems];
                    items[index].quantity_to_receive = parseInt(e.target.value) || 0;
                    setReceiveItems(items);
                  }}
                  sx={{ mt: 1 }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReceivePO} variant="contained" color="success" disabled={loading}>
            Receive Items
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrders;
