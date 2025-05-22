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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import api from '../utils/api';

const Groups = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupItems, setGroupItems] = useState({});

  // Check if user has edit permissions
  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups || []);
      
      // Fetch item counts for each group
      await fetchItemsForGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsForGroups = async (groupList) => {
    try {
      // First get all inventory items
      const response = await api.get('/inventory');
      const items = response.data;
      
      // Count items per group
      const groupCounts = {};
      items.forEach(item => {
        if (item.group) {
          groupCounts[item.group] = (groupCounts[item.group] || 0) + 1;
        }
      });
      
      setGroupItems(groupCounts);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }
    
    try {
      await api.post('/groups', { name: newGroupName });
      setSuccess(`Group "${newGroupName}" added successfully`);
      setNewGroupName('');
      setOpenAddDialog(false);
      fetchGroups();
    } catch (error) {
      console.error('Error adding group:', error);
      setError('Failed to add group');
    }
  };

  const handleRenameGroup = async () => {
    if (!editingGroup.newName.trim()) {
      setError('New group name cannot be empty');
      return;
    }
    
    try {
      await api.put(`/groups/${editingGroup.name}`, null, {
        params: { new_name: editingGroup.newName }
      });
      setSuccess(`Group renamed to "${editingGroup.newName}" successfully`);
      setOpenEditDialog(false);
      fetchGroups();
    } catch (error) {
      console.error('Error renaming group:', error);
      setError('Failed to rename group');
    }
  };

  const handleDeleteGroup = async () => {
    // Deleting a group doesn't have a direct API in this system
    // Normally, you would call an API endpoint to delete the group
    // For this example, we'll just close the dialog and show a message
    setSuccess(`Please note: To delete a group, reassign all its items to another group first.`);
    setOpenDeleteDialog(false);
  };

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
        Group Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        {canEdit && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Group
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length > 0 ? (
              groups.map((group) => (
                <TableRow key={group}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      {group}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={groupItems[group] || 0} 
                      variant="outlined" 
                      color={groupItems[group] ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {canEdit && (
                        <>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setEditingGroup({ name: group, newName: group });
                              setOpenEditDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setEditingGroup({ name: group });
                              setOpenDeleteDialog(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No groups found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Group Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for the new group. This will help categorize inventory items.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddGroup} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Rename Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a new name for the group "{editingGroup?.name}".
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="New Group Name"
            fullWidth
            variant="outlined"
            value={editingGroup?.newName || ''}
            onChange={(e) => setEditingGroup({ ...editingGroup, newName: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleRenameGroup} variant="contained" color="primary">
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the group "{editingGroup?.name}"?
            {groupItems[editingGroup?.name] > 0 && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                This group contains {groupItems[editingGroup?.name]} items. You must reassign these items before deleting the group.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteGroup} 
            variant="contained" 
            color="error"
            disabled={groupItems[editingGroup?.name] > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Groups; 