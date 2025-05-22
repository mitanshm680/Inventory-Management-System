import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import api from '../utils/api';

const Inventory = ({ user }) => {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 0,
    group: '',
    custom_fields: {}
  });
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [itemHistory, setItemHistory] = useState([]);
  const [error, setError] = useState('');
  const [customGroupName, setCustomGroupName] = useState('');
  const [priceInfo, setPriceInfo] = useState({ price: '', supplier: '' });
  const [prices, setPrices] = useState({});
  const [priceType, setPriceType] = useState('total');

  // Check if user has edit permissions
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');
  const canDelete = user && user.role === 'admin';

  useEffect(() => {
    fetchInventory();
    fetchGroups();
    fetchAllPrices();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const fetchItemHistory = async (itemName) => {
    try {
      const response = await api.get(`/inventory/${itemName}/history`);
      setItemHistory(response.data);
    } catch (error) {
      console.error('Error fetching item history:', error);
    }
  };

  const fetchAllPrices = async () => {
    try {
      const response = await api.get('/prices');
      const priceData = {};
      response.data.forEach(item => {
        priceData[item.item_name] = item;
      });
      setPrices(priceData);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      // First add the new item
      await api.post('/inventory', newItem);
      
      // If price is provided, add it as well
      if (priceInfo.price) {
        let priceValue = parseFloat(priceInfo.price);
        
        // If rate is selected and quantity is > 0, calculate total price
        if (priceType === 'rate' && newItem.quantity > 0) {
          priceValue = priceValue * newItem.quantity;
        }
        
        await api.put(`/prices/${newItem.item_name}`, {
          price: priceValue,
          supplier: priceInfo.supplier || '',
          price_per_unit: priceType === 'rate' ? parseFloat(priceInfo.price) : null
        });
      }
      
      setOpenAddDialog(false);
      resetForm();
      fetchInventory();
      fetchAllPrices();
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    try {
      await api.put(`/inventory/${currentItem.item_name}`, {
        quantity: currentItem.quantity,
        group: currentItem.group,
        custom_fields: currentItem.custom_fields
      });
      setOpenEditDialog(false);
      fetchInventory();
    } catch (error) {
      console.error('Error editing item:', error);
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/inventory/${currentItem.item_name}`);
      setOpenDeleteDialog(false);
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  const handleViewHistory = (item) => {
    setCurrentItem(item);
    fetchItemHistory(item.item_name);
    setOpenHistoryDialog(true);
  };

  const addCustomField = () => {
    if (customFieldKey && customFieldValue) {
      if (openAddDialog) {
        setNewItem({
          ...newItem,
          custom_fields: {
            ...newItem.custom_fields,
            [customFieldKey]: customFieldValue
          }
        });
      } else if (openEditDialog) {
        setCurrentItem({
          ...currentItem,
          custom_fields: {
            ...currentItem.custom_fields,
            [customFieldKey]: customFieldValue
          }
        });
      }
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const removeCustomField = (key) => {
    if (openAddDialog) {
      const updatedFields = { ...newItem.custom_fields };
      delete updatedFields[key];
      setNewItem({
        ...newItem,
        custom_fields: updatedFields
      });
    } else if (openEditDialog) {
      const updatedFields = { ...currentItem.custom_fields };
      delete updatedFields[key];
      setCurrentItem({
        ...currentItem,
        custom_fields: updatedFields
      });
    }
  };

  const resetForm = () => {
    setNewItem({
      item_name: '',
      quantity: 0,
      group: '',
      custom_fields: {}
    });
    setCustomFieldKey('');
    setCustomFieldValue('');
    setCustomGroupName('');
    setPriceInfo({ price: '', supplier: '' });
  };

  const handleAddNewGroup = async () => {
    try {
      await api.post('/groups', { name: customGroupName });
      setCustomGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Error adding new group:', error);
      setError('Failed to add new group');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || item.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search Items"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        <FormControl sx={{ minWidth: '200px' }}>
          <InputLabel id="group-filter-label">Filter by Group</InputLabel>
          <Select
            labelId="group-filter-label"
            value={selectedGroup}
            label="Filter by Group"
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <MenuItem value="">All Groups</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {canEdit && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Item
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Custom Fields</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.item_name}>
                  <TableCell component="th" scope="row">
                    {item.item_name}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        color: item.quantity < 10 ? 'error.main' : 'inherit',
                        fontWeight: item.quantity < 10 ? 'bold' : 'normal',
                      }}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.group || '-'}</TableCell>
                  <TableCell>
                    {prices[item.item_name] ? (
                      <Tooltip title={prices[item.item_name].supplier ? `Supplier: ${prices[item.item_name].supplier}` : 'No supplier info'}>
                        <Chip
                          icon={<MonetizationOnIcon />}
                          label={`$${prices[item.item_name].price.toFixed(2)}`}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Tooltip>
                    ) : null}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.custom_fields &&
                        Object.entries(item.custom_fields).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${value}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="View History">
                        <IconButton onClick={() => handleViewHistory(item)}>
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setCurrentItem(item);
                              setOpenEditDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setCurrentItem(item);
                              setOpenDeleteDialog(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Item Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            variant="outlined"
            value={newItem.item_name}
            onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
          />
          
          {/* Price information */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Price Information
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControl component="fieldset">
              <RadioGroup
                row
                name="priceType"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <FormControlLabel value="total" control={<Radio />} label="Total Price" />
                <FormControlLabel value="rate" control={<Radio />} label="Price Per Unit" />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="dense"
              label={priceType === 'total' ? "Total Price" : "Price Per Unit"}
              type="number"
              fullWidth
              variant="outlined"
              value={priceInfo.price}
              onChange={(e) => setPriceInfo({ ...priceInfo, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText={priceType === 'rate' ? `Total: $${(parseFloat(priceInfo.price || 0) * newItem.quantity).toFixed(2)}` : ''}
            />
            <TextField
              margin="dense"
              label="Supplier (optional)"
              fullWidth
              variant="outlined"
              value={priceInfo.supplier}
              onChange={(e) => setPriceInfo({ ...priceInfo, supplier: e.target.value })}
            />
          </Box>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Group</InputLabel>
            <Select
              value={newItem.group}
              label="Group"
              onChange={(e) => setNewItem({ ...newItem, group: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField 
                size="small" 
                label="New Group Name"
                value={customGroupName || ''}
                onChange={(e) => setCustomGroupName(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <Button 
                variant="contained" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={handleAddNewGroup}
                disabled={!customGroupName}
              >
                Add Group
              </Button>
            </Box>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Custom Fields
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Field Name"
              value={customFieldKey}
              onChange={(e) => setCustomFieldKey(e.target.value)}
              size="small"
            />
            <TextField
              label="Field Value"
              value={customFieldValue}
              onChange={(e) => setCustomFieldValue(e.target.value)}
              size="small"
            />
            <Button variant="outlined" onClick={addCustomField}>
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {Object.entries(newItem.custom_fields).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                onDelete={() => removeCustomField(key)}
                size="small"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          {currentItem && (
            <>
              <TextField
                margin="dense"
                label="Item Name"
                fullWidth
                variant="outlined"
                value={currentItem.item_name}
                disabled
              />
              <TextField
                margin="dense"
                label="Quantity"
                type="number"
                fullWidth
                variant="outlined"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })
                }
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Group</InputLabel>
                <Select
                  value={currentItem.group || ''}
                  label="Group"
                  onChange={(e) => setCurrentItem({ ...currentItem, group: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
                <Box sx={{ display: 'flex', mt: 1 }}>
                  <TextField 
                    size="small" 
                    label="New Group Name"
                    value={customGroupName || ''}
                    onChange={(e) => setCustomGroupName(e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ ml: 1 }}
                    onClick={handleAddNewGroup}
                    disabled={!customGroupName}
                  >
                    Add Group
                  </Button>
                </Box>
              </FormControl>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Custom Fields
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Field Name"
                  value={customFieldKey}
                  onChange={(e) => setCustomFieldKey(e.target.value)}
                  size="small"
                />
                <TextField
                  label="Field Value"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  size="small"
                />
                <Button variant="outlined" onClick={addCustomField}>
                  Add
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {currentItem.custom_fields &&
                  Object.entries(currentItem.custom_fields).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      onDelete={() => removeCustomField(key)}
                      size="small"
                    />
                  ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditItem} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{currentItem?.item_name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>History for {currentItem?.item_name}</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Group</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemHistory.length > 0 ? (
                  itemHistory.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{record.action}</TableCell>
                      <TableCell align="right">{record.quantity}</TableCell>
                      <TableCell>{record.group || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Inventory; 