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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Collapse,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../contexts/AuthContext';
import { useAppMode } from '../contexts/AppModeContext';
import { InventoryItem, Group } from '../types';
import { apiService } from '../services/api';

interface InventoryFormData {
  item_name: string;
  quantity: number;
  group?: string;
  reorder_point?: number;
  custom_fields?: Record<string, any>;
}

interface SupplierInfo {
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  is_available: boolean;
  lead_time_days?: number;
  minimum_order_quantity?: number;
}

interface LocationInfo {
  id: number;
  name: string;
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { isSimpleMode } = useAppMode();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyItemName, setHistoryItemName] = useState<string>('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Expanded rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [itemSuppliers, setItemSuppliers] = useState<Record<string, SupplierInfo[]>>({});
  const [loadingSuppliers, setLoadingSuppliers] = useState<Record<string, boolean>>({});

  // Supplier comparison dialog
  const [openCompareDialog, setOpenCompareDialog] = useState(false);
  const [compareItemName, setCompareItemName] = useState('');
  const [compareSuppliers, setCompareSuppliers] = useState<SupplierInfo[]>([]);

  // Quick action menu
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuItem, setActionMenuItem] = useState<InventoryItem | null>(null);

  // Form states for add/edit
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    item_name: '',
    quantity: 0,
    group: '',
    reorder_point: 10,
    custom_fields: {}
  });

  // Supplier selection for new items
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [supplierPrice, setSupplierPrice] = useState<number>(0);

  useEffect(() => {
    fetchInventoryData();
    fetchGroups();
    fetchLocations();
    fetchSuppliers();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const items = await apiService.getInventory();
      setItems(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await apiService.getGroups();
      setGroups(response.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiService.getLocations(true);
      const locationsList = response.locations || response;
      setLocations(Array.isArray(locationsList) ? locationsList : []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocations([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiService.getSuppliers();
      const suppliersList = response.suppliers || response;
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
    }
  };

  const fetchSuppliersForItem = async (itemName: string) => {
    if (itemSuppliers[itemName]) return; // Already loaded

    setLoadingSuppliers(prev => ({ ...prev, [itemName]: true }));
    try {
      const suppliers = await apiService.getItemSuppliers(itemName);
      setItemSuppliers(prev => ({ ...prev, [itemName]: suppliers }));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setItemSuppliers(prev => ({ ...prev, [itemName]: [] }));
    } finally {
      setLoadingSuppliers(prev => ({ ...prev, [itemName]: false }));
    }
  };

  const handleRowExpand = async (itemName: string) => {
    if (expandedRow === itemName) {
      setExpandedRow(null);
    } else {
      setExpandedRow(itemName);
      await fetchSuppliersForItem(itemName);
    }
  };

  const handleCompareSuppliers = async (itemName: string) => {
    setCompareItemName(itemName);
    setOpenCompareDialog(true);
    try {
      const suppliers = await apiService.getItemSuppliers(itemName);
      setCompareSuppliers(suppliers);
    } catch (err) {
      console.error('Error fetching suppliers for comparison:', err);
      setCompareSuppliers([]);
    }
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, item: InventoryItem) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuItem(item);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuItem(null);
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

  const handleGroupFilterChange = (event: SelectChangeEvent) => {
    setSelectedGroup(event.target.value);
    setPage(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'reorder_point' ? parseInt(value) : value
    });
  };

  const handleGroupChange = (event: SelectChangeEvent) => {
    setFormData({
      ...formData,
      group: event.target.value
    });
  };

  const handleAddClick = () => {
    setCurrentItem(null);
    setFormData({
      item_name: '',
      quantity: 0,
      group: '',
      reorder_point: 10,
      custom_fields: {}
    });
    setSelectedSupplier('');
    setSupplierPrice(0);
    setOpenDialog(true);
  };

  const handleEditClick = async (item: InventoryItem) => {
    handleActionMenuClose();
    setCurrentItem(item);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      group: item.group || '',
      reorder_point: item.reorder_point || 10,
      custom_fields: item.custom_fields || {}
    });

    // Load existing suppliers for this item
    try {
      const itemSuppliers = await apiService.getItemSuppliers(item.item_name);
      if (itemSuppliers && itemSuppliers.length > 0) {
        // Pre-select the first supplier
        setSelectedSupplier(itemSuppliers[0].supplier_id);
        setSupplierPrice(itemSuppliers[0].unit_price || 0);
      } else {
        setSelectedSupplier('');
        setSupplierPrice(0);
      }
    } catch (err) {
      console.error('Error loading item suppliers:', err);
      setSelectedSupplier('');
      setSupplierPrice(0);
    }

    setOpenDialog(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    handleActionMenuClose();
    setDeleteItemId(item.item_name);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await apiService.deleteItem(deleteItemId);
      setSuccess(`Item "${deleteItemId}" has been deleted`);
      fetchInventoryData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    } finally {
      setIsDeleting(false);
      setDeleteItemId(null);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (formData: InventoryFormData) => {
    try {
      const apiData = {
        item_name: formData.item_name,
        quantity: formData.quantity,
        group_name: formData.group || null,
        reorder_point: formData.reorder_point,
        custom_fields: formData.custom_fields
      };

      if (currentItem) {
        await apiService.updateItem(currentItem.item_name, apiData);

        // Update supplier relationship if one is selected
        if (selectedSupplier && supplierPrice > 0) {
          try {
            // First check if relationship exists
            const itemSuppliers = await apiService.getItemSuppliers(currentItem.item_name);
            const existingSupplier = itemSuppliers.find((s: any) => s.supplier_id === selectedSupplier);

            if (existingSupplier) {
              // Update existing relationship
              await apiService.updateSupplierProduct(existingSupplier.id, {
                supplier_id: selectedSupplier,
                item_name: formData.item_name,
                unit_price: supplierPrice,
                is_available: true,
                minimum_order_quantity: 1,
                lead_time_days: 7
              });
            } else {
              // Create new relationship
              await apiService.createSupplierProduct({
                supplier_id: selectedSupplier,
                item_name: formData.item_name,
                unit_price: supplierPrice,
                is_available: true,
                minimum_order_quantity: 1,
                lead_time_days: 7
              });
            }
            setSuccess(`Item "${formData.item_name}" has been updated with supplier`);
          } catch (supplierErr) {
            console.error('Error updating supplier product:', supplierErr);
            setSuccess(`Item "${formData.item_name}" has been updated`);
          }
        } else {
          setSuccess(`Item "${formData.item_name}" has been updated`);
        }
      } else {
        await apiService.addItem(apiData);
        setSuccess(`Item "${formData.item_name}" has been added`);

        // If a supplier was selected, add the supplier product relationship
        if (selectedSupplier && supplierPrice > 0) {
          try {
            await apiService.createSupplierProduct({
              supplier_id: selectedSupplier,
              item_name: formData.item_name,
              unit_price: supplierPrice,
              is_available: true,
              minimum_order_quantity: 1,
              lead_time_days: 7
            });
            setSuccess(`Item "${formData.item_name}" has been added with supplier`);
          } catch (supplierErr) {
            console.error('Error adding supplier product:', supplierErr);
            // Don't fail the whole operation, just log it
          }
        }
      }
      fetchInventoryData();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item');
    } finally {
      setOpenDialog(false);
      setCurrentItem(null);
      setSelectedSupplier('');
      setSupplierPrice(0);
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  const handleHistoryClick = async (itemName: string) => {
    handleActionMenuClose();
    setHistoryItemName(itemName);
    setOpenHistoryDialog(true);
    setLoadingHistory(true);
    try {
      const response = await apiService.get(`/inventory/${itemName}/history`);
      setHistoryData(response.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleHistoryDialogClose = () => {
    setOpenHistoryDialog(false);
    setHistoryData([]);
    setHistoryItemName('');
  };

  const handleLocationChange = async (itemName: string, locationId: number) => {
    try {
      // Update item with new location using item-locations API
      await apiService.assignItemToLocation({
        item_name: itemName,
        location_id: locationId || null,
        quantity: items.find(i => i.item_name === itemName)?.quantity || 0
      });

      setSuccess(`Location updated for ${itemName}`);
      // Refresh inventory to show updated location
      fetchInventoryData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getBestSupplier = (itemName: string): SupplierInfo | null => {
    const suppliers = itemSuppliers[itemName];
    if (!suppliers || suppliers.length === 0) return null;

    const availableSuppliers = suppliers.filter(s => s.is_available);
    if (availableSuppliers.length === 0) return null;

    return availableSuppliers.reduce((best, current) =>
      current.unit_price < best.unit_price ? current : best
    );
  };

  // Filter items based on search term and selected group
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemGroup = item.group_name || '';
    const matchesGroup = !selectedGroup || itemGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Pagination
  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>

        {/* Search and filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Group</InputLabel>
                <Select
                  value={selectedGroup}
                  onChange={handleGroupFilterChange}
                  label="Filter by Group"
                  startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">All Groups</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.group_name} value={group.group_name}>
                      {group.group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
              {canEdit && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                  size="large"
                >
                  Add New Item
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Inventory Table */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table sx={{ minWidth: 650 }} aria-label="inventory table">
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell><strong>Item Name</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    {!isSimpleMode && <TableCell><strong>Supplier(s)</strong></TableCell>}
                    {!isSimpleMode && <TableCell><strong>Location</strong></TableCell>}
                    <TableCell><strong>Group</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => {
                      const bestSupplier = getBestSupplier(item.item_name);
                      const suppliers = itemSuppliers[item.item_name] || [];
                      const isExpanded = expandedRow === item.item_name;

                      return (
                        <React.Fragment key={item.item_name}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleRowExpand(item.item_name)}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </TableCell>
                            <TableCell component="th" scope="row">
                              <Typography variant="body1" fontWeight="medium">
                                {item.item_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Typography variant="body1">
                                  {item.quantity}
                                </Typography>
                                {item.quantity < (item.reorder_point || 10) && (
                                  <Chip
                                    label="Low Stock"
                                    color="error"
                                    size="small"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            {!isSimpleMode && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                  {loadingSuppliers[item.item_name] ? (
                                    <CircularProgress size={16} />
                                  ) : bestSupplier ? (
                                    <>
                                      <Tooltip title="Best Price">
                                        <Chip
                                          icon={<TrendingDownIcon />}
                                          label={`${bestSupplier.supplier_name} - $${bestSupplier.unit_price.toFixed(2)}`}
                                          color="success"
                                          size="small"
                                          variant="outlined"
                                        />
                                      </Tooltip>
                                      {suppliers.length > 1 && (
                                        <Chip
                                          label={`+${suppliers.length - 1} more`}
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleCompareSuppliers(item.item_name)}
                                          sx={{ cursor: 'pointer' }}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <Chip
                                      label="No suppliers"
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleRowExpand(item.item_name)}
                                      sx={{ cursor: 'pointer' }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                            )}
                            {!isSimpleMode && (
                              <TableCell>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <Select
                                    value={item.location_id || ''}
                                    onChange={(e) => handleLocationChange(item.item_name, Number(e.target.value))}
                                    displayEmpty
                                    variant="standard"
                                  >
                                    <MenuItem value="">
                                      <em>No Location</em>
                                    </MenuItem>
                                    {locations.map((location) => (
                                      <MenuItem key={location.id} value={location.id}>
                                        {location.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip
                                label={item.group_name || 'Uncategorized'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={(e) => handleActionMenuOpen(e, item)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>

                          {/* Expandable Row */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isSimpleMode ? 5 : 7}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Grid container spacing={2}>
                                    {/* Supplier Details */}
                                    <Grid item xs={12} md={6}>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <LocalShippingIcon fontSize="small" />
                                          Available Suppliers
                                        </Typography>
                                        {suppliers.length > 0 ? (
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell>Supplier</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Lead Time</TableCell>
                                                <TableCell align="right">Min Order</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {suppliers.map((supplier, idx) => (
                                                <TableRow key={idx}>
                                                  <TableCell>
                                                    {supplier.supplier_name}
                                                    {idx === 0 && (
                                                      <Chip
                                                        label="Best"
                                                        color="success"
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                      />
                                                    )}
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    ${supplier.unit_price.toFixed(2)}
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    {supplier.lead_time_days || '-'} days
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    {supplier.minimum_order_quantity || 1}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        ) : (
                                          <Typography variant="body2" color="text.secondary">
                                            No suppliers configured for this item
                                          </Typography>
                                        )}
                                      </Paper>
                                    </Grid>

                                    {/* Item Details */}
                                    <Grid item xs={12} md={6}>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Item Details
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Reorder Point:</Typography>
                                            <Typography variant="body2">{item.reorder_point || 10}</Typography>
                                          </Box>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                                            <Typography variant="body2">
                                              {(item.updated_at || item.created_at)
                                                ? new Date(item.updated_at || item.created_at!).toLocaleDateString()
                                                : 'N/A'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Paper>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Quick Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {canEdit && (
          <MenuItem onClick={() => actionMenuItem && handleEditClick(actionMenuItem)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Item</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => actionMenuItem && handleCompareSuppliers(actionMenuItem.item_name)}>
          <ListItemIcon>
            <CompareArrowsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Compare Suppliers</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => actionMenuItem && handleHistoryClick(actionMenuItem.item_name)}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
        {canEdit && user?.role === 'admin' && (
          <>
            <Divider />
            <MenuItem onClick={() => actionMenuItem && handleDeleteClick(actionMenuItem)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete Item</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Compare Suppliers Dialog */}
      <Dialog open={openCompareDialog} onClose={() => setOpenCompareDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Compare Suppliers: {compareItemName}
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Min Order</TableCell>
                  <TableCell align="right">Lead Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compareSuppliers.map((supplier, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index === 0 ? 'success.light' : 'inherit',
                      '&:hover': { backgroundColor: index === 0 ? 'success.light' : 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {supplier.supplier_name}
                        {index === 0 && (
                          <Chip label="Best Price" color="success" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={index === 0 ? 'bold' : 'normal'}>
                        ${supplier.unit_price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {supplier.minimum_order_quantity || 1}
                    </TableCell>
                    <TableCell align="right">
                      {supplier.lead_time_days || '-'} days
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.is_available ? 'Available' : 'Unavailable'}
                        color={supplier.is_available ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentItem ? `Edit Item: ${currentItem.item_name}` : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="item_name"
                  label="Item Name"
                  value={formData.item_name}
                  onChange={handleInputChange}
                  disabled={!!currentItem}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="quantity"
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="reorder_point"
                  label="Reorder Point"
                  type="number"
                  value={formData.reorder_point}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Group</InputLabel>
                  <Select
                    name="group"
                    value={formData.group}
                    onChange={handleGroupChange}
                    label="Group"
                  >
                    <MenuItem value="">None</MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.group_name} value={group.group_name}>
                        {group.group_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Supplier selection for both adding and editing */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Supplier (Optional)</InputLabel>
                  <Select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value as number)}
                    label="Supplier (Optional)"
                  >
                    <MenuItem value="">None</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedSupplier && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Unit Price"
                    type="number"
                    value={supplierPrice}
                    onChange={(e) => setSupplierPrice(parseFloat(e.target.value) || 0)}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => handleSubmit(formData as InventoryFormData)} color="primary" variant="contained">
            {currentItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the item "{deleteItemId}"? This action cannot be undone.
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

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={handleHistoryDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Item History: {historyItemName}
        </DialogTitle>
        <DialogContent>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : historyData.length > 0 ? (
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={entry.action}
                          size="small"
                          color={
                            entry.action === 'ADD' || entry.action === 'CREATE'
                              ? 'success'
                              : entry.action === 'REMOVE' || entry.action === 'DELETE'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">{entry.quantity || '-'}</TableCell>
                      <TableCell>{entry.group_name || '-'}</TableCell>
                      <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 3, textAlign: 'center' }} color="textSecondary">
              No history found for this item
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHistoryDialogClose} color="primary">
            Close
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

export default Inventory;
