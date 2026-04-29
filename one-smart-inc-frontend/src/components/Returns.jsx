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
  Chip,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  AssignmentReturn as ReturnIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { purchasesAPI, returnsAPI } from '../services/api';
import { format } from 'date-fns';

const Returns = ({ onNotification }) => {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [returnData, setReturnData] = useState({
    returnedQty: '',
    expectedRefund: '',
    actualRefund: '',
  });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchasesAPI.getAll();
      // Filter only purchases with remaining quantity > 0
      setPurchases(response.data.filter(p => p.remainingQty > 0));
    } catch (error) {
      console.error('Error fetching purchases:', error);
      onNotification('Error loading purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleReturnClick = (purchase) => {
    setSelectedPurchase(purchase);
    setReturnData({
      returnedQty: '',
      expectedRefund: '',
      actualRefund: '',
    });
    setDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    const updatedData = { ...returnData, [field]: value };

    // Auto-calculate expected refund when quantity changes
    if (field === 'returnedQty' && selectedPurchase) {
      const qty = parseFloat(value) || 0;
      const priceAfterDiscount = selectedPurchase.purchasePrice * (1 - selectedPurchase.discount / 100);
      updatedData.expectedRefund = (qty * priceAfterDiscount).toFixed(2);
      updatedData.actualRefund = updatedData.expectedRefund; // Default to expected
    }

    setReturnData(updatedData);
  };

  const handleSubmitReturn = async () => {
    try {
      // Validation
      if (!returnData.returnedQty || !returnData.expectedRefund || !returnData.actualRefund) {
        onNotification('Please fill in all return details', 'error');
        return;
      }

      const qty = parseInt(returnData.returnedQty);
      if (qty <= 0 || qty > selectedPurchase.remainingQty) {
        onNotification(`Return quantity must be between 1 and ${selectedPurchase.remainingQty}`, 'error');
        return;
      }

      const submitData = {
        purchaseId: selectedPurchase._id,
        returnedQty: qty,
        expectedRefund: parseFloat(returnData.expectedRefund),
        actualRefund: parseFloat(returnData.actualRefund),
      };

      await returnsAPI.create(submitData);
      onNotification('Return processed successfully', 'success');
      setDialogOpen(false);
      fetchPurchases(); // Refresh the list
    } catch (error) {
      console.error('Error processing return:', error);
      onNotification('Error processing return', 'error');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPurchase(null);
    setReturnData({
      returnedQty: '',
      expectedRefund: '',
      actualRefund: '',
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;
    if (days <= 0) return { label: 'Expired', color: 'error' };
    if (days <= 7) return { label: `${days} days`, color: 'error' };
    if (days <= 30) return { label: `${days} days`, color: 'warning' };
    return null; // Don't show chip for items not expiring soon
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price * (1 - discount / 100);
  };

  const renderLoadingSkeletons = () => (
    Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {Array(7).fill(0).map((_, cellIndex) => (
          <TableCell key={`cell-${index}-${cellIndex}`}>
            <Skeleton variant="text" width="100%" height={30} />
          </TableCell>
        ))}
        <TableCell align="center">
          <Skeleton variant="rounded" width={80} height={30} sx={{ mx: 'auto' }} />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <Box>
      <Alert
        severity="info"
        sx={{
          mb: 4,
          borderRadius: 3,
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
      >
        <Typography variant="body2">
          Use this section to return products to suppliers. Returns will automatically update inventory quantities.
          Focus on items expiring soon or those with quality issues.
        </Typography>
      </Alert>

      <Card sx={{ mb: 4, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          '&:last-child': { pb: 2 },
        }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Available Items for Return
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh inventory">
              <IconButton onClick={fetchPurchases} color="primary" size="large">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: 'none',
        border: '1px solid #e0e0e0',
        borderRadius: 3,
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Purchase Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Available Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Purchase Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Discount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Effective Price</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Expiry Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                renderLoadingSkeletons()
              ) : (
                purchases.map((purchase) => {
                  const expiryStatus = getExpiryStatus(purchase.expiryDate);
                  const effectivePrice = calculateDiscountedPrice(purchase.purchasePrice, purchase.discount);

                  return (
                    <TableRow
                      key={purchase._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {purchase.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(new Date(purchase.purchaseDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={purchase.remainingQty <= 10 ? 'error' : 'inherit'}
                          fontWeight={purchase.remainingQty <= 10 ? 'bold' : 'normal'}
                        >
                          {purchase.remainingQty}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">₹{purchase.purchasePrice}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={purchase.discount > 0 ? 'success.main' : 'text.secondary'}
                          fontWeight={purchase.discount > 0 ? 'medium' : 'normal'}
                        >
                          {purchase.discount}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">₹{effectivePrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {purchase.expiryDate ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {format(new Date(purchase.expiryDate), 'dd/MM/yyyy')}
                            {expiryStatus && (
                              <Chip
                                label={expiryStatus.label}
                                color={expiryStatus.color}
                                size="small"
                                icon={<WarningIcon fontSize="small" />}
                                sx={{ height: '24px' }}
                              />
                            )}
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ReturnIcon />}
                          onClick={() => handleReturnClick(purchase)}
                          sx={{
                            minWidth: '100px',
                            boxShadow: 'none',
                          }}
                        >
                          Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!loading && purchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No items available for return. All inventory has been sold or returned.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Return Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 'none',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            Process Return
          </Typography>
          {selectedPurchase && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
              {selectedPurchase.productName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {selectedPurchase && (
            <Box>
              <Card
                variant="outlined"
                sx={{
                  mb: 4,
                  bgcolor: 'grey.50',
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                    Product Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Purchase Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {format(new Date(selectedPurchase.purchaseDate), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Available Quantity
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedPurchase.remainingQty}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Original Price
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          ₹{selectedPurchase.purchasePrice}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Discount Applied
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedPurchase.discount}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Effective Price per Unit (after discount)
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="medium">
                        ₹{calculateDiscountedPrice(selectedPurchase.purchasePrice, selectedPurchase.discount).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                Return Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField
                      fullWidth
                      label="Return Quantity"
                      type="number"
                      value={returnData.returnedQty}
                      onChange={(e) => handleInputChange('returnedQty', e.target.value)}
                      helperText={`Maximum: ${selectedPurchase.remainingQty}`}
                      required
                      InputProps={{
                        inputProps: {
                          min: 1,
                          max: selectedPurchase.remainingQty
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField
                      fullWidth
                      label="Expected Refund"
                      type="number"
                      value={returnData.expectedRefund}
                      onChange={(e) => handleInputChange('expectedRefund', e.target.value)}
                      InputProps={{
                        startAdornment: "₹",
                      }}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <TextField
                      fullWidth
                      label="Actual Refund Received"
                      type="number"
                      value={returnData.actualRefund}
                      onChange={(e) => handleInputChange('actualRefund', e.target.value)}
                      helperText="Some suppliers may not refund full amount"
                      InputProps={{
                        startAdornment: "₹",
                      }}
                      required
                    />
                  </Box>
                </Box>
                {returnData.expectedRefund && returnData.actualRefund && (
                  <Alert
                    severity={
                      parseFloat(returnData.actualRefund) < parseFloat(returnData.expectedRefund)
                        ? 'warning'
                        : 'success'
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {parseFloat(returnData.actualRefund) < parseFloat(returnData.expectedRefund)
                      ? `Loss on return: ₹${(parseFloat(returnData.expectedRefund) - parseFloat(returnData.actualRefund)).toFixed(2)}`
                      : 'Full refund will be received'
                    }
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleDialogClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReturn}
            variant="contained"
            color="primary"
            startIcon={<ReturnIcon />}
          >
            Process Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Returns;
