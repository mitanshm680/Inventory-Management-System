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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Stack,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import api from '../utils/api';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState<string | null>(null);

  // Form states for add/edit
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    name: '',
    email: ''
  });

  // Disable operations on self
  const isSelf = (username: string) => username === currentUser?.username;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setFormData({
      ...formData,
      role: event.target.value as 'admin' | 'editor' | 'viewer'
    });
  };

  const handleAddClick = () => {
    setCurrentEditUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
      name: '',
      email: ''
    });
    setOpenDialog(true);
  };

  const handleEditClick = (user: User) => {
    setCurrentEditUser(user);
    setFormData({
      username: user.username,
      password: '', // Password not edited
      role: user.role,
      name: user.name || '',
      email: user.email || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (user: User) => {
    setDeleteUsername(user.username);
    setIsDeleting(true);
  };

  const handleDelete = async () => {
    if (!deleteUsername) return;
    
    try {
      await api.delete(`/users/${deleteUsername}`);
      setSuccess(`User "${deleteUsername}" has been deleted`);
      fetchUsers(); // Refresh users
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteUsername(null);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      if (currentEditUser) {
        // Update existing user
        await api.put(`/users/${currentEditUser.username}`, {
          role: formData.role
        });
        setSuccess(`User "${currentEditUser.username}" has been updated`);
      } else {
        // Add new user
        await api.post('/users', {
          username: formData.username,
          password: formData.password,
          role: formData.role
        });
        setSuccess(`User "${formData.username}" has been added`);
      }
      setOpenDialog(false);
      fetchUsers(); // Refresh users
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please check your input and try again.');
    }
  };

  const handleAlertClose = () => {
    setError(null);
    setSuccess(null);
  };

  // Get role display props
  const getRoleDisplay = (role: string) => {
    switch(role) {
      case 'admin':
        return { icon: <AdminPanelSettingsIcon fontSize="small" />, color: 'error', label: 'Admin' };
      case 'editor':
        return { icon: <EditNoteIcon fontSize="small" />, color: 'primary', label: 'Editor' };
      default:
        return { icon: <VisibilityIcon fontSize="small" />, color: 'default', label: 'Viewer' };
    }
  };

  // Pagination
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="body1">
                Manage system users and their access roles
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
              >
                Add New User
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => {
                      const roleDisplay = getRoleDisplay(user.role);
                      return (
                        <TableRow key={user.username}>
                          <TableCell component="th" scope="row">
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon color="action" fontSize="small" />
                              <span>{user.username}</span>
                              {isSelf(user.username) && (
                                <Chip size="small" label="You" variant="outlined" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={roleDisplay.icon} 
                              label={roleDisplay.label}
                              color={roleDisplay.color as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleString()
                              : 'Never logged in'
                            }
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleEditClick(user)}
                              size="small"
                              disabled={isSelf(user.username)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteClick(user)}
                              size="small"
                              disabled={isSelf(user.username)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No users found
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
            count={users.length}
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
          {currentEditUser ? `Edit User: ${currentEditUser.username}` : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!currentEditUser && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="username"
                      label="Username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    label="Role"
                    inputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {getRoleDisplay(formData.role).icon}
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="editor">Editor</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
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
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {currentEditUser ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onClose={() => setIsDeleting(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user "{deleteUsername}"? This action cannot be undone.
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

export default Users; 