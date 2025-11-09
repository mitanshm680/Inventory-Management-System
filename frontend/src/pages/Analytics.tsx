import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  SelectChangeEvent,
  Tab,
  Tabs,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
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
  ArcElement,
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

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Financial Summary
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inventory Value
  const [inventoryValue, setInventoryValue] = useState<any[]>([]);

  // Top Items
  const [topItems, setTopItems] = useState<any[]>([]);
  const [topItemsMetric, setTopItemsMetric] = useState('value');

  // Revenue by Period
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState('daily');

  // Cost Analysis
  const [costAnalysis, setCostAnalysis] = useState<any>(null);

  // Profit Margins
  const [profitMargins, setProfitMargins] = useState<any>(null);

  useEffect(() => {
    fetchFinancialSummary();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchInventoryValue();
    fetchCostAnalysis();
    fetchProfitMargins();
  }, []);

  useEffect(() => {
    fetchTopItems();
  }, [topItemsMetric]);

  useEffect(() => {
    fetchRevenueByPeriod();
  }, [revenuePeriod]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFinancialSummary(startDate, endDate);
      setFinancialSummary(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryValue = async () => {
    try {
      const data = await apiService.getInventoryValueBreakdown();
      setInventoryValue(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const fetchTopItems = async () => {
    try {
      const data = await apiService.getTopItems(topItemsMetric, 10);
      setTopItems(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const fetchRevenueByPeriod = async () => {
    try {
      const data = await apiService.getRevenueByPeriod(revenuePeriod, 30);
      setRevenueData(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const fetchCostAnalysis = async () => {
    try {
      const data = await apiService.getCostAnalysis();
      setCostAnalysis(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const fetchProfitMargins = async () => {
    try {
      const data = await apiService.getProfitMargins();
      setProfitMargins(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const inventoryValueChartData = {
    labels: inventoryValue.map((item) => item.category),
    datasets: [
      {
        label: 'Total Value',
        data: inventoryValue.map((item) => item.total_value),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topItemsChartData = {
    labels: topItems.map((item) => item.item_name),
    datasets: [
      {
        label: topItemsMetric === 'value' ? 'Total Value' : topItemsMetric === 'quantity' ? 'Quantity' : 'Movement',
        data: topItems.map((item) =>
          topItemsMetric === 'value' ? item.total_value : topItemsMetric === 'quantity' ? item.quantity : item.total_moved
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: revenueData.map((item) => item.period).reverse(),
    datasets: [
      {
        label: 'Total Cost',
        data: revenueData.map((item) => item.total_cost).reverse(),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const profitMarginChartData = profitMargins
    ? {
        labels: profitMargins.by_category.map((item: any) => item.category),
        datasets: [
          {
            label: 'Profit Margin %',
            data: profitMargins.by_category.map((item: any) => item.profit_margin_percent),
            backgroundColor: profitMargins.by_category.map((item: any) =>
              item.profit_margin_percent > 30
                ? 'rgba(75, 192, 192, 0.6)'
                : item.profit_margin_percent > 15
                ? 'rgba(255, 206, 86, 0.6)'
                : 'rgba(255, 99, 132, 0.6)'
            ),
            borderColor: profitMargins.by_category.map((item: any) =>
              item.profit_margin_percent > 30
                ? 'rgba(75, 192, 192, 1)'
                : item.profit_margin_percent > 15
                ? 'rgba(255, 206, 86, 1)'
                : 'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Inventory Value" />
          <Tab label="Top Items" />
          <Tab label="Cost Analysis" />
          <Tab label="Profit Margins" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
        </Grid>

        {financialSummary && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Estimated Revenue
                      </Typography>
                    </Box>
                    <Typography variant="h4">${financialSummary.estimated_revenue.toLocaleString()}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {financialSummary.gross_profit >= 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        {financialSummary.items_sold} items sold
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MoneyOffIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Costs
                      </Typography>
                    </Box>
                    <Typography variant="h4">${financialSummary.total_purchase_cost.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {financialSummary.total_purchase_orders} purchase orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Gross Profit
                      </Typography>
                    </Box>
                    <Typography variant="h4" color={financialSummary.gross_profit >= 0 ? 'success.main' : 'error.main'}>
                      ${financialSummary.gross_profit.toLocaleString()}
                    </Typography>
                    <Chip
                      label={`${financialSummary.profit_margin_percent.toFixed(1)}% margin`}
                      size="small"
                      color={financialSummary.profit_margin_percent >= 20 ? 'success' : financialSummary.profit_margin_percent >= 10 ? 'warning' : 'error'}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InventoryIcon color="info" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Inventory Value
                      </Typography>
                    </Box>
                    <Typography variant="h4">${financialSummary.current_inventory_value.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {financialSummary.total_items} items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cost Trends
                    </Typography>
                    <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
                      <InputLabel>Period</InputLabel>
                      <Select
                        value={revenuePeriod}
                        label="Period"
                        onChange={(e: SelectChangeEvent) => setRevenuePeriod(e.target.value)}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                    {revenueData.length > 0 && (
                      <Box sx={{ height: 300 }}>
                        <Line data={revenueChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Inventory Value by Category
                    </Typography>
                    {inventoryValue.length > 0 && (
                      <Box sx={{ height: 300 }}>
                        <Doughnut
                          data={inventoryValueChartData}
                          options={{ maintainAspectRatio: false, responsive: true }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Inventory Value Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total Quantity</TableCell>
                <TableCell align="right">Avg Unit Price</TableCell>
                <TableCell align="right">Total Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryValue.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.item_count}</TableCell>
                  <TableCell align="right">{row.total_quantity}</TableCell>
                  <TableCell align="right">${row.avg_unit_price.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${row.total_value.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Top Items Tab */}
      <TabPanel value={tabValue} index={2}>
        <FormControl sx={{ mb: 3, minWidth: 200 }}>
          <InputLabel>Metric</InputLabel>
          <Select
            value={topItemsMetric}
            label="Metric"
            onChange={(e: SelectChangeEvent) => setTopItemsMetric(e.target.value)}
          >
            <MenuItem value="value">By Total Value</MenuItem>
            <MenuItem value="quantity">By Quantity</MenuItem>
            <MenuItem value="movement">By Movement</MenuItem>
          </Select>
        </FormControl>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top 10 Items
                </Typography>
                {topItems.length > 0 && (
                  <Box sx={{ height: 400 }}>
                    <Bar
                      data={topItemsChartData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        indexAxis: 'y',
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">
                      {topItemsMetric === 'value'
                        ? 'Value'
                        : topItemsMetric === 'quantity'
                        ? 'Quantity'
                        : 'Movement'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topItems.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.group_name}</TableCell>
                      <TableCell align="right">
                        {topItemsMetric === 'value'
                          ? `$${item.total_value.toLocaleString()}`
                          : topItemsMetric === 'quantity'
                          ? item.quantity
                          : item.total_moved}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Cost Analysis Tab */}
      <TabPanel value={tabValue} index={3}>
        {costAnalysis && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Costs by Supplier
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Total Spent</TableCell>
                          <TableCell align="right">Avg Order</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costAnalysis.by_supplier.map((row: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.supplier_name}</TableCell>
                            <TableCell align="right">{row.total_orders}</TableCell>
                            <TableCell align="right">${row.total_spent.toLocaleString()}</TableCell>
                            <TableCell align="right">${row.avg_order_value.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Costs by Item
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Total Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costAnalysis.by_item.slice(0, 10).map((row: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.item_name}</TableCell>
                            <TableCell align="right">{row.order_count}</TableCell>
                            <TableCell align="right">{row.total_quantity_ordered}</TableCell>
                            <TableCell align="right">${row.total_cost.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Profit Margins Tab */}
      <TabPanel value={tabValue} index={4}>
        {profitMargins && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profit Margins by Category
                  </Typography>
                  {profitMarginChartData && (
                    <Box sx={{ height: 300, mb: 3 }}>
                      <Bar
                        data={profitMarginChartData}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Profit Margin %',
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Items</TableCell>
                          <TableCell align="right">Avg Cost</TableCell>
                          <TableCell align="right">Avg Price</TableCell>
                          <TableCell align="right">Margin %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profitMargins.by_category.map((row: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.category}</TableCell>
                            <TableCell align="right">{row.item_count}</TableCell>
                            <TableCell align="right">${row.avg_cost.toFixed(2)}</TableCell>
                            <TableCell align="right">${row.avg_selling_price.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.profit_margin_percent.toFixed(1)}%`}
                                size="small"
                                color={
                                  row.profit_margin_percent >= 30
                                    ? 'success'
                                    : row.profit_margin_percent >= 15
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Profit Margin Items
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Avg Cost</TableCell>
                          <TableCell align="right">Avg Price</TableCell>
                          <TableCell align="right">Profit/Unit</TableCell>
                          <TableCell align="right">Margin %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profitMargins.by_item.map((row: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.item_name}</TableCell>
                            <TableCell>{row.group_name}</TableCell>
                            <TableCell align="right">${row.avg_cost.toFixed(2)}</TableCell>
                            <TableCell align="right">${row.avg_selling_price.toFixed(2)}</TableCell>
                            <TableCell align="right">${row.profit_per_unit.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.profit_margin_percent.toFixed(1)}%`}
                                size="small"
                                color={
                                  row.profit_margin_percent >= 30
                                    ? 'success'
                                    : row.profit_margin_percent >= 15
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>
    </Box>
  );
};

export default Analytics;
