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
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import api from '../utils/api';

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [groupItems, setGroupItems] = useState<Record<string, number>>({});

  // Form states for add/edit
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      
      // Map API response to Group interface format
      const groupsData = response.data.groups || [];
      const mappedGroups = groupsData.map((group: any) => ({
        id: group.id || group.group_name, // Use group_name as id if id is not present
        name: group.group_name,  // backend uses group_name
        description: group.description || '',
        created_at: group.created_at || new Date().toISOString(),
        updated_at: group.updated_at || new Date().toISOString()
      }));
      
      setGroups(mappedGroups);
      
      // Get item counts per group
      const inventoryResponse = await api.get('/inventory');
      const inventory = inventoryResponse.data;
      
      const groupCounts: Record<string, number> = {};
      inventory.forEach((item: any) => {
        if (item.group) {
          if (!groupCounts[item.group]) {
            groupCounts[item.group] = 0;
          }
          groupCounts[item.group]++;
        }
      });
      
      setGroupItems(groupCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddClick = () => {
    setCurrentGroup(null);
    setFormData({
      name: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditClick = (group: Group) => {
    setCurrentGroup(group);
    setFormData({
      name: group.name,
      description: group.description
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (group: Group) => {
    setDeleteGroupId(group.name);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!deleteGroupId) return;
    
    try {
      // Use the DELETE endpoint to remove the group
      await api.delete(`/groups/${deleteGroupId}`);
      setSuccess(`Group "${deleteGroupId}" has been deleted`);
      fetchGroups(); // Refresh groups
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteGroupId(null);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      if (currentGroup) {
        // Update existing group
        await api.put(`/groups/${currentGroup.name}?new_name=${formData.name}`);
        setSuccess(`Group "${currentGroup.name}" has been renamed to "${formData.name}"`);
      } else {
        // Add new group
        await api.post('/groups', {
          group_name: formData.name,
          description: formData.description
        });
        setSuccess(`Group "${formData.name}" has been added`);
      }
      setOpenDialog(false);
      fetchGroups(); // Refresh groups
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group. Please check your input and try again.');
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    (group.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (group.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedGroups = filteredGroups.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Groups Management
        </Typography>
        
        {/* Search and Add button */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              {canEdit && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                >
                  Add New Group
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Groups overview in cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Groups Overview
          </Typography>
          <Grid container spacing={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : paginatedGroups.length > 0 ? (
              paginatedGroups.map((group) => (
                <Grid item xs={12} sm={6} md={4} key={group.name}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" component="div">
                            {group.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            {group.description || 'No description'}
                          </Typography>
                          <Chip 
                            icon={<GroupsIcon />} 
                            label={`${groupItems[group.name] || 0} items`} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        {canEdit && (
                          <Box>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditClick(group)}
                            >
                              <EditIcon />
                            </IconButton>
                            {isAdmin && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(group)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No groups found</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Pagination */}
        <Paper sx={{ p: 1 }}>
          <TablePagination
            component="div"
            count={filteredGroups.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6, 12, 24]}
          />
        </Paper>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentGroup ? `Edit Group: ${currentGroup.name}` : 'Add New Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="name"
                  label="Group Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {currentGroup ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the group "{deleteGroupId}"? 
            {groupItems[deleteGroupId || ''] > 0 && (
              <Box component="span" fontWeight="bold">
                 This group contains {groupItems[deleteGroupId || '']} items that will be ungrouped!
              </Box>
            )}
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

export default Groups; 