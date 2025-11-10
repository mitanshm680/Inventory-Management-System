import React from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton animation="wave" height={20} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton animation="wave" height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                <Skeleton variant="text" width="60%" height={24} />
              </Box>
              <Skeleton variant="text" width="40%" height={40} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 350 }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
    </Paper>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      {Array.from({ length: items }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={30} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => {
  return (
    <Box sx={{ mt: 2 }}>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Stats Cards */}
      <CardSkeleton count={4} />

      {/* Charts */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <ChartSkeleton height={350} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ListSkeleton items={5} />
        </Grid>
      </Grid>
    </Box>
  );
};

// Page Header Skeleton
export const PageHeaderSkeleton: React.FC = () => {
  return (
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={24} />
    </Box>
  );
};

// Search Bar Skeleton
export const SearchBarSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Skeleton variant="rectangular" width="60%" height={56} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width="20%" height={56} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width="20%" height={56} sx={{ borderRadius: 1 }} />
    </Box>
  );
};

// Button Group Skeleton
export const ButtonGroupSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width={100}
          height={40}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  );
};

// Detailed Item Skeleton (for expanded rows or detail views)
export const DetailedItemSkeleton: React.FC = () => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mt: 2 }}>
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          {Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="70%" height={24} />
            </Box>
          ))}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={6}>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width="30%" height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="30%" height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="30%" height={32} sx={{ borderRadius: 1 }} />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Tabs Skeleton
export const TabsSkeleton: React.FC<{ tabCount?: number }> = ({ tabCount = 3 }) => {
  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: tabCount }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={100}
              height={48}
              sx={{ borderRadius: '4px 4px 0 0' }}
            />
          ))}
        </Box>
      </Box>
      <TableSkeleton rows={5} columns={5} />
    </Box>
  );
};

// Full Page Skeleton
export const FullPageSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <Box sx={{ mb: 2 }}>
        <ButtonGroupSkeleton count={3} />
      </Box>
      <TableSkeleton rows={10} columns={7} />
    </Box>
  );
};

export default {
  TableSkeleton,
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  PageHeaderSkeleton,
  SearchBarSkeleton,
  ButtonGroupSkeleton,
  DetailedItemSkeleton,
  TabsSkeleton,
  FullPageSkeleton,
};
