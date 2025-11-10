import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { apiService } from '../services/api';
import { getErrorMessage } from '../utils/validationSchemas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Forecasting: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Demand Prediction
  const [demandPredictions, setDemandPredictions] = useState<any[]>([]);
  const [daysAhead, setDaysAhead] = useState(30);

  // Reorder Recommendations
  const [reorderRecommendations, setReorderRecommendations] = useState<any[]>([]);

  // Seasonal Analysis
  const [seasonalAnalysis, setSeasonalAnalysis] = useState<any[]>([]);

  useEffect(() => {
    fetchDemandPredictions();
  }, [daysAhead]);

  useEffect(() => {
    fetchReorderRecommendations();
    fetchSeasonalAnalysis();
  }, []);

  const fetchDemandPredictions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDemandPrediction(undefined, daysAhead);
      setDemandPredictions(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchReorderRecommendations = async () => {
    try {
      const data = await apiService.getReorderRecommendations();
      setReorderRecommendations(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const fetchSeasonalAnalysis = async () => {
    try {
      const data = await apiService.getSeasonalAnalysis();
      setSeasonalAnalysis(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Chart data for demand predictions
  const demandChartData = {
    labels: demandPredictions.slice(0, 10).map((item) => item.item_name),
    datasets: [
      {
        label: 'Current Stock',
        data: demandPredictions.slice(0, 10).map((item) => item.current_stock),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: `Predicted Demand (${daysAhead} days)`,
        data: demandPredictions.slice(0, 10).map((item) => item.predicted_demand_next_30_days),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for seasonal analysis
  const seasonalChartData = seasonalAnalysis.length > 0 && seasonalAnalysis[0] ? {
    labels: seasonalAnalysis[0].monthly_breakdown?.map((m: any) => m.month) || [],
    datasets: seasonalAnalysis.slice(0, 5).map((item, index) => ({
      label: item.item_name,
      data: item.monthly_breakdown?.map((m: any) => m.movement) || [],
      borderColor: `hsl(${index * 72}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 72}, 70%, 50%, 0.1)`,
      tension: 0.4,
    })),
  } : null;

  const criticalItems = demandPredictions.filter((item) => item.urgency === 'critical').length;
  const highPriorityItems = demandPredictions.filter(
    (item) => item.urgency === 'high' || item.urgency === 'critical'
  ).length;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Inventory Forecasting
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Critical Items
                </Typography>
              </Box>
              <Typography variant="h3">{criticalItems}</Typography>
              <Typography variant="caption" color="text.secondary">
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  High Priority
                </Typography>
              </Box>
              <Typography variant="h3">{highPriorityItems}</Typography>
              <Typography variant="caption" color="text.secondary">
                Need reordering soon
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCartIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Reorder Recommendations
                </Typography>
              </Box>
              <Typography variant="h3">{reorderRecommendations.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                Items to reorder
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Items Tracked
                </Typography>
              </Box>
              <Typography variant="h3">{demandPredictions.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                With historical data
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Demand Predictions" />
          <Tab label="Reorder Recommendations" />
          <Tab label="Seasonal Analysis" />
        </Tabs>
      </Box>

      {/* Demand Predictions Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Forecast Period</InputLabel>
            <Select
              value={daysAhead}
              label="Forecast Period"
              onChange={(e: SelectChangeEvent<number>) => setDaysAhead(e.target.value as number)}
            >
              <MenuItem value={7}>Next 7 days</MenuItem>
              <MenuItem value={14}>Next 14 days</MenuItem>
              <MenuItem value={30}>Next 30 days</MenuItem>
              <MenuItem value={60}>Next 60 days</MenuItem>
              <MenuItem value={90}>Next 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchDemandPredictions}>
            Refresh Predictions
          </Button>
        </Box>

        {demandPredictions.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top 10 Items - Current Stock vs Predicted Demand
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Bar
                      data={demandChartData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Avg Daily Use</TableCell>
                <TableCell align="right">Predicted Demand</TableCell>
                <TableCell align="right">Days Until Empty</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && demandPredictions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading predictions...
                  </TableCell>
                </TableRow>
              ) : demandPredictions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No prediction data available. Add some stock adjustments to generate predictions.
                  </TableCell>
                </TableRow>
              ) : (
                demandPredictions.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.group_name || 'Uncategorized'}</TableCell>
                    <TableCell align="right">{item.current_stock}</TableCell>
                    <TableCell align="right">{item.avg_daily_consumption.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.predicted_demand_next_30_days.toFixed(0)}</TableCell>
                    <TableCell align="right">
                      {item.days_until_depletion ? (
                        <Typography
                          variant="body2"
                          color={
                            item.days_until_depletion < 7
                              ? 'error'
                              : item.days_until_depletion < 14
                              ? 'warning.main'
                              : 'text.primary'
                          }
                        >
                          {item.days_until_depletion} days
                        </Typography>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={item.urgency.toUpperCase()} color={getUrgencyColor(item.urgency) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      {item.should_reorder && (
                        <Chip label="Reorder Now" color="warning" size="small" icon={<ShoppingCartIcon />} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Reorder Recommendations Tab */}
      <TabPanel value={tabValue} index={1}>
        <Alert severity="info" sx={{ mb: 3 }}>
          These recommendations are based on current stock levels, historical consumption, and lead times.
        </Alert>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Reorder Level</TableCell>
                <TableCell align="right">Recommended Qty</TableCell>
                <TableCell align="right">Estimated Cost</TableCell>
                <TableCell align="right">Lead Time</TableCell>
                <TableCell>Priority</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reorderRecommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No reorder recommendations at this time. All items are well stocked!
                  </TableCell>
                </TableRow>
              ) : (
                reorderRecommendations.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.item_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.group_name || 'Uncategorized'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={item.current_stock <= item.reorder_level ? 'error' : 'inherit'}>
                        {item.current_stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.reorder_level}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {item.recommended_order_qty}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">${item.estimated_cost.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.avg_lead_time_days} days</TableCell>
                    <TableCell>
                      <Chip label={item.priority.toUpperCase()} color={getPriorityColor(item.priority) as any} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {reorderRecommendations.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Total Estimated Cost: $
              {reorderRecommendations.reduce((sum, item) => sum + item.estimated_cost, 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              for {reorderRecommendations.length} items
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Seasonal Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Seasonal patterns help predict demand fluctuations throughout the year. Items with high seasonality index (&gt;1.5)
          show significant seasonal variation.
        </Alert>

        {seasonalAnalysis.length > 0 && seasonalChartData && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top 5 Seasonal Items - Monthly Movement Patterns
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Line
                      data={seasonalChartData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {seasonalAnalysis.map((item, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography sx={{ flex: 1 }}>{item.item_name}</Typography>
                <Chip
                  label={`Seasonality: ${item.seasonality_index}`}
                  color={item.is_seasonal ? 'warning' : 'default'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                  Peak: {item.peak_month}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Seasonal Statistics
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Peak Month</TableCell>
                        <TableCell align="right">
                          {item.peak_month} ({item.peak_month_movement} units)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Low Month</TableCell>
                        <TableCell align="right">
                          {item.low_month} ({item.low_month_movement} units)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Monthly Movement</TableCell>
                        <TableCell align="right">{item.avg_monthly_movement}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Seasonality Index</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.seasonality_index}
                            color={item.is_seasonal ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pattern</TableCell>
                        <TableCell align="right">
                          {item.is_seasonal ? 'Highly Seasonal' : 'Steady Demand'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Monthly Breakdown
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Movement</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.monthly_breakdown.map((month: any, mIndex: number) => (
                          <TableRow key={mIndex}>
                            <TableCell>{month.month}</TableCell>
                            <TableCell align="right">{month.movement}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {seasonalAnalysis.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No seasonal data available. Need at least one year of historical data to analyze seasonal patterns.
            </Typography>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
};

export default Forecasting;
