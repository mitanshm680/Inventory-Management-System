import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Grid,
  IconButton,
  Collapse,
  Typography,
  Divider,
  Slider,
  SelectChangeEvent,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'dateRange' | 'range';
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ActiveFilter {
  id: string;
  label: string;
  value: any;
  displayValue?: string;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onApplyFilters,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const handleFilterChange = (filterId: string, value: any, displayValue?: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const handleApply = () => {
    const nonEmptyFilters = Object.entries(filterValues).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ''
    );

    const activeFiltersList: ActiveFilter[] = nonEmptyFilters.map(([id, value]) => {
      const filter = filters.find((f) => f.id === id);
      let displayValue = String(value);

      if (filter?.type === 'select') {
        const option = filter.options?.find((o) => o.value === value);
        displayValue = option?.label || String(value);
      } else if (filter?.type === 'dateRange' && Array.isArray(value)) {
        displayValue = `${value[0]} to ${value[1]}`;
      } else if (filter?.type === 'range' && Array.isArray(value)) {
        displayValue = `${value[0]} - ${value[1]}`;
      }

      return {
        id,
        label: filter?.label || id,
        value,
        displayValue,
      };
    });

    setActiveFilters(activeFiltersList);
    onApplyFilters(Object.fromEntries(nonEmptyFilters));
    setExpanded(false);
  };

  const handleClear = () => {
    setFilterValues({});
    setActiveFilters([]);
    onClearFilters();
  };

  const handleRemoveFilter = (filterId: string) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[filterId];
    setFilterValues(newFilterValues);

    const newActiveFilters = activeFilters.filter((f) => f.id !== filterId);
    setActiveFilters(newActiveFilters);

    const nonEmptyFilters = Object.entries(newFilterValues).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ''
    );
    onApplyFilters(Object.fromEntries(nonEmptyFilters));
  };

  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterValues[filter.id] || '';

    switch (filter.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            size="small"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              label={filter.label}
              onChange={(e: SelectChangeEvent) => handleFilterChange(filter.id, e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            size="small"
            inputProps={{ min: filter.min, max: filter.max, step: filter.step }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'dateRange':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              type="date"
              label={`${filter.label} From`}
              value={value[0] || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, [e.target.value, value[1] || ''])
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label={`${filter.label} To`}
              value={value[1] || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, [value[0] || '', e.target.value])
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );

      case 'range':
        return (
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {filter.label}
            </Typography>
            <Slider
              value={value || [filter.min || 0, filter.max || 100]}
              onChange={(_, newValue) => handleFilterChange(filter.id, newValue)}
              valueLabelDisplay="auto"
              min={filter.min || 0}
              max={filter.max || 100}
              step={filter.step || 1}
              marks
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">{filter.min || 0}</Typography>
              <Typography variant="caption">{filter.max || 100}</Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Filter Toggle Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<FilterListIcon />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
          variant="outlined"
          size="small"
        >
          Advanced Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </Button>

        {activeFilters.length > 0 && (
          <Button
            startIcon={<ClearIcon />}
            onClick={handleClear}
            color="error"
            size="small"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {activeFilters.map((filter) => (
            <Chip
              key={filter.id}
              label={`${filter.label}: ${filter.displayValue}`}
              onDelete={() => handleRemoveFilter(filter.id)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Filter Panel */}
      <Collapse in={expanded}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filter Options
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            {filters.map((filter) => (
              <Grid item xs={12} sm={6} md={4} key={filter.id}>
                {renderFilterInput(filter)}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button onClick={handleClear} variant="outlined" color="secondary">
              Reset
            </Button>
            <Button onClick={handleApply} variant="contained" color="primary">
              Apply Filters
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default AdvancedFilters;
