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
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../contexts/AuthContext';
import { InventoryItem, Group } from '../types';
import { apiService } from '../services/api';

interface InventoryFormData {
  item_name: string;
  quantity: number;
  group?: string;
  reorder_point?: number;
  custom_fields?: Record<string, any>;
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
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

  // Form states for add/edit
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    item_name: '',
    quantity: 0,
    group: '',
    reorder_point: 10,
    custom_fields: {}
  });

  useEffect(() => {
    fetchInventoryData();
    fetchGroups();
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
      // API returns {groups: [...]}
      setGroups(response.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]);
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
    setOpenDialog(true);
  };

  const handleEditClick = (item: InventoryItem) => {
    setCurrentItem(item);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      group: item.group || '',
      reorder_point: item.reorder_point || 10,
      custom_fields: item.custom_fields || {}
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setDeleteItemId(item.item_name);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    
    try {
      await apiService.deleteItem(deleteItemId);
      setSuccess(`Item "${deleteItemId}" has been deleted`);
      fetchInventoryData(); // Refresh inventory
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
      // Transform group to group_name for API
      const apiData = {
        item_name: formData.item_name,
        quantity: formData.quantity,
        group_name: formData.group || null,
        reorder_point: formData.reorder_point,
        custom_fields: formData.custom_fields
      };

      if (currentItem) {
        // Update existing item
        await apiService.updateItem(currentItem.item_name, apiData);
        setSuccess(`Item "${formData.item_name}" has been updated`);
      } else {
        // Add new item
        await apiService.addItem(apiData);
        setSuccess(`Item "${formData.item_name}" has been added`);
      }
      fetchInventoryData(); // Refresh inventory list
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item');
    } finally {
      setOpenDialog(false);
      setCurrentItem(null);
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  const handleHistoryClick = async (itemName: string) => {
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
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>
        
        {/* Search and filters */}
        <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
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
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell align="right">Reorder Point</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="center">History</TableCell>
                    {canEdit && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => (
                      <TableRow key={item.item_name}>
                        <TableCell component="th" scope="row">
                          {item.item_name}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {item.quantity}
                            {item.quantity < (item.reorder_point || 10) && (
                              <Chip 
                                label="Low Stock" 
                                color="error" 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{item.group_name || 'Uncategorized'}</TableCell>
                        <TableCell align="right">{item.reorder_point || 10}</TableCell>
                        <TableCell>
                          {(item.updated_at || item.created_at) ? new Date(item.updated_at || item.created_at!).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="info"
                            onClick={() => handleHistoryClick(item.item_name)}
                            size="small"
                            title="View History"
                          >
                            <HistoryIcon />
                          </IconButton>
                        </TableCell>
                        {canEdit && (
                          <TableCell align="center">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleEditClick(item)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            {user?.role === 'admin' && (
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteClick(item)}
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
                      <TableCell colSpan={canEdit ? 7 : 6} align="center">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

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