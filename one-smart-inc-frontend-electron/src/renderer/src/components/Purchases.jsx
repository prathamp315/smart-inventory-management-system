import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { purchasesAPI, productsAPI } from '../services/api';
import { format } from 'date-fns';

const Purchases = ({ onNotification }) => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    quantity: '',
    purchasePrice: '',
    discount: '0',
    mrp: '',
    expiryDate: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesResponse, productsResponse] = await Promise.all([
        purchasesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPurchases(purchasesResponse.data);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      onNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.productName || !formData.quantity || !formData.purchasePrice || !formData.mrp) {
        onNotification('Please fill in all required fields', 'error');
        return;
      }

      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        discount: parseFloat(formData.discount),
        mrp: parseFloat(formData.mrp),
        remainingQty: parseInt(formData.quantity),
      };

      await purchasesAPI.create(submitData);
      onNotification('Purchase added successfully', 'success');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating purchase:', error);
      onNotification('Error adding purchase', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: '',
      purchasePrice: '',
      discount: '0',
      mrp: '',
      expiryDate: '',
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;
    if (days <= 0) return { label: 'Expired', color: 'error' };
    if (days <= 7) return { label: `${days} days`, color: 'error' };
    if (days <= 30) return { label: `${days} days`, color: 'warning' };
    return { label: `${days} days`, color: 'success' };
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };

  // Filter purchases based on search term
  const filteredPurchases = purchases.filter(purchase =>
    purchase.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Card sx={{ mb: 4, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          '&:last-child': { pb: 2 },
        }}>
          <TextField
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh inventory">
              <IconButton onClick={fetchData} color="primary" size="large">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              size="large"
            >
              Add Purchase
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{
        overflow: 'hidden',
        boxShadow: 'none',
        border: '1px solid #e0e0e0'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">MRP</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>Loading...</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell align="right">--</TableCell>
                    <TableCell align="right">--</TableCell>
                    <TableCell align="right">--</TableCell>
                    <TableCell align="right">--</TableCell>
                    <TableCell align="right">--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                  </TableRow>
                ))
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No purchases match your search' : 'No purchases found. Click "Add Purchase" to add inventory.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => {
                  const expiryStatus = getExpiryStatus(purchase.expiryDate);
                  return (
                    <TableRow key={purchase._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {purchase.productName}
                        </Typography>
                      </TableCell>
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
                      <TableCell align="right">₹{purchase.purchasePrice}</TableCell>
                      <TableCell align="right">{purchase.discount}%</TableCell>
                      <TableCell align="right">₹{purchase.mrp}</TableCell>
                      <TableCell>
                        {purchase.expiryDate
                          ? format(new Date(purchase.expiryDate), 'dd/MM/yyyy')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {expiryStatus && (
                          <Chip
                            label={expiryStatus.label}
                            color={expiryStatus.color}
                            size="small"
                            icon={expiryStatus.color === 'error' ? <WarningIcon fontSize="small" /> : undefined}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Purchase Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 'none',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle>Add New Purchase</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, m: 2 }}>
            <Autocomplete
              options={products.map(p => p.name)}
              value={formData.productName}
              onChange={(event, newValue) => handleInputChange('productName', newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product Name"
                  required
                  fullWidth
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  required
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Purchase Price per Unit"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  required
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => handleInputChange('discount', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="MRP per Unit"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => handleInputChange('mrp', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  required
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>

            {formData.purchasePrice && formData.discount && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Effective Price after discount: ₹{calculateDiscountedPrice(
                    parseFloat(formData.purchasePrice || 0),
                    parseFloat(formData.discount || 0)
                  ).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<AddIcon />}>
            Add Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases;
