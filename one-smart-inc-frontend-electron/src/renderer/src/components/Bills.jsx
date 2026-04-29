import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  InputAdornment,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  LocalOffer as DiscountIcon,
} from '@mui/icons-material';
import { billsAPI } from '../services/api';
import { format } from 'date-fns';

const Bills = ({ onNotification }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billsAPI.getAll();
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      onNotification('Error loading bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();

    // Listen for data refresh events (from sync)
    const handleDataRefresh = (event) => {
      if (event.detail.source === 'sync') {
        console.log('Bills component refreshing due to sync');
        fetchBills();
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    // Cleanup event listener
    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBill(null);
  };

  const calculateTotalDiscount = (bill) => {
    return bill.items.reduce((totalDiscount, item) => {
      const originalItemTotal = item.quantity * item.pricePerUnit;
      const actualItemTotal = item.total;
      return totalDiscount + (originalItemTotal - actualItemTotal);
    }, 0);
  };

  const calculateTotalMRP = (bill) => {
    return bill.items.reduce((totalMRP, item) => {
      return totalMRP + (item.quantity * item.pricePerUnit);
    }, 0);
  };

  const handlePrintBill = (bill) => {
    const totalDiscount = calculateTotalDiscount(bill);
    const totalMRP = calculateTotalMRP(bill);

    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>One Smart Inc</h2>
          <p>Inventory Management System</p>
          <hr>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Bill No:</strong> ${bill.billNo}<br>
          <strong>Customer:</strong> ${bill.customerName || 'Walk-in Customer'}<br>
          <strong>Date:</strong> ${format(new Date(bill.createdAt), 'dd/MM/yyyy')}<br>
          <strong>Time:</strong> ${format(new Date(bill.createdAt), 'HH:mm:ss')}
        </div>
        
        <hr>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #ccc;">
              <th style="text-align: left; padding: 4px; border-right: 1px solid #eee;">Item</th>
              <th style="text-align: right; padding: 4px; border-right: 1px solid #eee;">Qty</th>
              <th style="text-align: right; padding: 4px; border-right: 1px solid #eee;">MRP</th>
              <th style="text-align: right; padding: 4px; border-right: 1px solid #eee;">Disc%</th>
              <th style="text-align: right; padding: 4px; border-right: 1px solid #eee;">Rate</th>
              <th style="text-align: right; padding: 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 4px; border-right: 1px solid #eee;">${item.productName}</td>
                <td style="text-align: right; padding: 4px; border-right: 1px solid #eee;">${item.quantity}</td>
                <td style="text-align: right; padding: 4px; border-right: 1px solid #eee;">₹${item.pricePerUnit}</td>
                <td style="text-align: right; padding: 4px; border-right: 1px solid #eee;">${item.discount || 0}%</td>
                <td style="text-align: right; padding: 4px; border-right: 1px solid #eee;">₹${(item.discountedPrice || item.pricePerUnit).toFixed(2)}</td>
                <td style="text-align: right; padding: 4px;">₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <hr>
        
        <div style="text-align: right; margin-top: 15px;">
          ${totalDiscount > 0 ? 
            `<div style="margin-bottom: 5px;">
              <span>Total MRP: ₹${totalMRP.toFixed(2)}</span><br>
              <span style="color: #4caf50; font-weight: bold;">Total Discount: ₹${totalDiscount.toFixed(2)}</span>
            </div>
            <hr style="margin: 10px 0;">` : ''}
          <div style="margin-bottom: 10px;">
            <strong style="font-size: 14px;">Total Amount: ₹${bill.totalAmount.toFixed(2)}</strong>
          </div>
          <div style="margin-bottom: 5px;">
            <strong>Paid Amount: ₹${bill.paidAmount.toFixed(2)}</strong>
          </div>
          <div style="margin-bottom: 5px;">
            <strong>Payment Method: ${bill.paymentMethod}</strong>
          </div>
          ${bill.totalAmount - bill.paidAmount !== 0 ? 
            `<div style="margin-top: 10px; padding: 5px; background-color: #fff3cd; border: 1px solid #ffeaa7;">
              <strong>Balance Due: ₹${(bill.totalAmount - bill.paidAmount).toFixed(2)}</strong>
            </div>` : 
            `<div style="margin-top: 10px; padding: 5px; background-color: #d4edda; border: 1px solid #c3e6cb;">
              <strong>✓ Fully Paid</strong>
            </div>`}
        </div>
        
        <div style="text-align: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 15px;">
          <p style="margin: 5px 0;"><strong>Thank you for your business!</strong></p>
          <p style="margin: 5px 0; font-size: 11px;">Visit us again soon</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${bill.billNo}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getPaymentStatus = (bill) => {
    const balance = bill.totalAmount - bill.paidAmount;
    if (balance === 0) return { label: 'Paid', color: 'success' };
    if (balance > 0) return { label: 'Pending', color: 'warning' };
    return { label: 'Overpaid', color: 'info' };
  };

  const filteredBills = bills.filter(bill =>
    bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customerName && bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderLoadingSkeletons = () => (
    Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell align="right"><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell align="right"><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="rectangular" width={60} height={24} /></TableCell>
        <TableCell align="center">
          <Skeleton variant="circular" width={30} height={30} />
        </TableCell>
      </TableRow>
    ))
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
            placeholder="Search bills..."
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
            <Tooltip title="Refresh bills">
              <IconButton onClick={fetchBills} color="primary" size="large">
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
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Bill Number</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Customer</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Original Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Total Discount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Final Amount</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Paid Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                renderLoadingSkeletons()
              ) : (
                filteredBills.map((bill) => {
                  const paymentStatus = getPaymentStatus(bill);
                  const totalDiscount = calculateTotalDiscount(bill);
                  const totalMRP = calculateTotalMRP(bill);

                  return (
                    <TableRow
                      key={bill._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {bill.billNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {bill.customerName || 'Walk-in Customer'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ textDecoration: totalDiscount > 0 ? 'line-through' : 'none', color: totalDiscount > 0 ? 'text.secondary' : 'text.primary' }}>
                          ₹{totalMRP.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {totalDiscount > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <DiscountIcon fontSize="small" color="success" />
                            <Typography variant="body2" color="success.main" fontWeight="medium">
                              ₹{totalDiscount.toFixed(2)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            ₹0.00
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          ₹{bill.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">₹{bill.paidAmount.toFixed(2)}</TableCell>
                      <TableCell>{bill.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          label={paymentStatus.label}
                          color={paymentStatus.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(bill.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewBill(bill)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Bill">
                            <IconButton size="small" onClick={() => handlePrintBill(bill)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {!loading && filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No bills match your search' : 'No bills found. Create your first bill from the Billing page.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 'none',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            <Typography variant="h6">Bill Details</Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedBill && (
            <Box sx={{m:2}}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Bill Number
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {selectedBill.billNo}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Customer Name
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {selectedBill.customerName || 'Walk-in Customer'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Date & Time
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {format(new Date(selectedBill.createdAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">MRP</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Final Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.pricePerUnit}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color={item.discount > 0 ? 'success.main' : 'text.secondary'}
                            fontWeight={item.discount > 0 ? 'medium' : 'normal'}
                          >
                            {item.discount || 0}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">₹{(item.discountedPrice || item.pricePerUnit).toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {calculateTotalDiscount(selectedBill) > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Total Discount Applied: ₹{calculateTotalDiscount(selectedBill).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Original Amount: ₹{calculateTotalMRP(selectedBill).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ₹{selectedBill.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Paid Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{selectedBill.paidAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Method
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {selectedBill.paymentMethod}
                  </Typography>
                </Box>
              </Box>

              {selectedBill.totalAmount !== selectedBill.paidAmount && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Balance: ₹{(selectedBill.totalAmount - selectedBill.paidAmount).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Close
          </Button>
          <Button
            onClick={() => handlePrintBill(selectedBill)}
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bills;

