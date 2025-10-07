import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  InputAdornment,
  CircularProgress,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CategoryIcon from '@mui/icons-material/Category';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface SearchResult {
  id: string;
  type: 'item' | 'supplier' | 'location' | 'batch' | 'group' | 'user';
  title: string;
  subtitle?: string;
  path: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Search inventory items
      const inventoryData = await apiService.getInventory();
      const items = inventoryData.filter((item: any) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.group?.toLowerCase().includes(lowerQuery)
      );
      items.slice(0, 5).forEach((item: any) => {
        searchResults.push({
          id: item.name,
          type: 'item',
          title: item.name,
          subtitle: `${item.quantity} in stock - ${item.group || 'No group'}`,
          path: `/inventory`
        });
      });

      // Search suppliers
      const suppliersData = await apiService.getSuppliers();
      const suppliers = suppliersData.filter((supplier: any) =>
        supplier.name.toLowerCase().includes(lowerQuery) ||
        supplier.email?.toLowerCase().includes(lowerQuery)
      );
      suppliers.slice(0, 3).forEach((supplier: any) => {
        searchResults.push({
          id: supplier.id.toString(),
          type: 'supplier',
          title: supplier.name,
          subtitle: supplier.email || supplier.phone,
          path: `/suppliers`
        });
      });

      // Search locations
      const locationsData = await apiService.getLocations();
      const locations = locationsData.filter((location: any) =>
        location.name.toLowerCase().includes(lowerQuery) ||
        location.address?.toLowerCase().includes(lowerQuery)
      );
      locations.slice(0, 3).forEach((location: any) => {
        searchResults.push({
          id: location.id.toString(),
          type: 'location',
          title: location.name,
          subtitle: location.address,
          path: `/locations`
        });
      });

      // Search batches
      const batchesData = await apiService.getBatches();
      const batches = batchesData.filter((batch: any) =>
        batch.batch_number.toLowerCase().includes(lowerQuery) ||
        batch.item_name.toLowerCase().includes(lowerQuery)
      );
      batches.slice(0, 3).forEach((batch: any) => {
        searchResults.push({
          id: batch.id.toString(),
          type: 'batch',
          title: `Batch ${batch.batch_number}`,
          subtitle: `${batch.item_name} - Expires: ${batch.expiry_date || 'N/A'}`,
          path: `/batches`
        });
      });

      // Search groups
      const groupsData = await apiService.getGroups();
      const groups = groupsData.filter((group: any) =>
        group.name.toLowerCase().includes(lowerQuery)
      );
      groups.slice(0, 3).forEach((group: any) => {
        searchResults.push({
          id: group.name,
          type: 'group',
          title: group.name,
          subtitle: `${group.item_count} items`,
          path: `/groups`
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchAll]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'item': return <InventoryIcon />;
      case 'supplier': return <LocalShippingIcon />;
      case 'location': return <WarehouseIcon />;
      case 'batch': return <QrCodeIcon />;
      case 'group': return <CategoryIcon />;
      case 'user': return <GroupIcon />;
      default: return <SearchIcon />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { position: 'fixed', top: 100, m: 0 }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search inventory, suppliers, locations, batches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: loading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
        </Box>

        <Divider />

        {results.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
            {results.map((result, index) => (
              <ListItem
                key={`${result.type}-${result.id}`}
                button
                selected={index === selectedIndex}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                sx={{
                  borderLeft: index === selectedIndex ? '3px solid primary.main' : '3px solid transparent',
                  '&.Mui-selected': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon>{getIcon(result.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{result.title}</Typography>
                      <Chip
                        label={result.type}
                        size="small"
                        sx={{ textTransform: 'capitalize', height: 20 }}
                      />
                    </Box>
                  }
                  secondary={result.subtitle}
                />
              </ListItem>
            ))}
          </List>
        ) : query.length >= 2 && !loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No results found for "{query}"
            </Typography>
          </Box>
        ) : query.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Type to search across all inventory data
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip icon={<InventoryIcon />} label="Items" size="small" />
              <Chip icon={<LocalShippingIcon />} label="Suppliers" size="small" />
              <Chip icon={<WarehouseIcon />} label="Locations" size="small" />
              <Chip icon={<QrCodeIcon />} label="Batches" size="small" />
              <Chip icon={<CategoryIcon />} label="Groups" size="small" />
            </Box>
          </Box>
        ) : null}

        <Divider />
        <Box sx={{ p: 1, px: 2, display: 'flex', gap: 2, justifyContent: 'flex-end', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            <kbd>↑↓</kbd> Navigate
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <kbd>Enter</kbd> Select
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <kbd>Esc</kbd> Close
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
