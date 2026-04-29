import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  TrendingUp as SalesIcon,
  Inventory as InventoryIcon,
  ShoppingCart as PurchaseIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { purchasesAPI, billsAPI } from '../services/api';
import * as localdb from '../services/localdb';
import { format } from 'date-fns';

const Dashboard = ({ onNotification }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalPurchases: 0,
    expiringItems: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch purchases and expiring items first (these should work)
      const [purchasesResponse, expiringResponse] = await Promise.all([
        purchasesAPI.getAll(),
        purchasesAPI.getExpiring(),
      ]);

      const purchases = purchasesResponse.data;
      const expiring = expiringResponse.data;

      // Calculate basic stats
      const uniqueProducts = [...new Set(purchases.map(p => p.productName))];

      // Try to fetch bills for sales data, but don't break if it fails
      let totalSales;
      try {
        const billsResponse = await billsAPI.getAll();
        const bills = billsResponse.data;
        totalSales = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      } catch (billsError) {
        console.warn('Could not fetch bills data:', billsError);
        // Set sales to 0 if bills API fails
        totalSales = 0;
      }

      setStats({
        totalSales,
        totalProducts: uniqueProducts.length,
        totalPurchases: purchases.length,
        expiringItems: expiring.length,
      });

      setRecentPurchases(purchases.slice(0, 10));
      setExpiringItems(expiring.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      onNotification('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocalDB = async () => {
    try {
      if (window.confirm('Are you sure you want to clear all local database data? This action cannot be undone.')) {
        await localdb.clearAllData();
        onNotification('Local database cleared successfully', 'success');
        // Refresh dashboard data after clearing
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error clearing local database:', error);
      onNotification('Error clearing local database', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: 'none',
      border: '1px solid #e0e0e0'
    }}>
      <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ color, fontSize: '2rem' }}>{icon}</Box>
          <Typography variant="h4" component="div" color={color} sx={{ fontWeight: 'bold', textAlign: 'right' }}>
            {title.includes('Sales') ? `₹${value.toLocaleString()}` : value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryChipColor = (days) => {
    if (days <= 7) return 'error';
    if (days <= 14) return 'warning';
    return 'info';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Action Buttons - Absolute positioned */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        display: 'flex',
        gap: 1,
        mb: 4,
      }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleClearLocalDB}
          sx={{height: '40px'}}
        >
          Clear LocalDB
        </Button>
        <IconButton
          onClick={fetchDashboardData}
          color="primary"
          size="large"
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Cards - Centered and compact */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 4,
        maxWidth: '900px',
        mx: 'auto',
        pt: 6, // Add padding top to avoid overlap with absolute buttons
      }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '220px' }}>
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon={<SalesIcon />}
            color="success.main"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '220px' }}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<InventoryIcon />}
            color="primary.main"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '220px' }}>
          <StatCard
            title="Purchase Batches"
            value={stats.totalPurchases}
            icon={<PurchaseIcon />}
            color="secondary.main"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '220px' }}>
          <StatCard
            title="Expiring Soon"
            value={stats.expiringItems}
            icon={<WarningIcon />}
            color="warning.main"
          />
        </Box>
      </Box>

      {/* Bottom Section - Flex layout */}
      <Box sx={{
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        {/* Recent Purchases */}
        <Box sx={{ flex: '2 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              Recent Purchases
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Purchase Date</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell align="right">MRP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPurchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>{purchase.productName}</TableCell>
                      <TableCell>
                        {format(new Date(purchase.purchaseDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell align="right">{purchase.quantity}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={purchase.remainingQty <= 10 ? 'error' : 'inherit'}
                          fontWeight={purchase.remainingQty <= 10 ? 'bold' : 'normal'}
                        >
                          {purchase.remainingQty}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">₹{purchase.mrp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Expiring Items */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Paper sx={{ p: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              Items Expiring Soon
            </Typography>
            {expiringItems.length === 0 ? (
              <Typography color="text.secondary">
                No items expiring in the next 30 days
              </Typography>
            ) : (
              <Box sx={{ mt: 2 }}>
                {expiringItems.map((item) => {
                  const daysLeft = getDaysUntilExpiry(item.expiryDate);
                  return (
                    <Box
                      key={item._id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {item.productName}
                        </Typography>
                        <Chip
                          label={`${daysLeft} days`}
                          color={getExpiryChipColor(daysLeft)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {item.remainingQty} | Expires: {format(new Date(item.expiryDate), 'dd/MM/yyyy')}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
