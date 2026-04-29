import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Autocomplete, Chip, Card, CardContent, InputAdornment, Tooltip, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Warning as WarningIcon, Search as SearchIcon, ShoppingCart as PurchaseIcon } from '@mui/icons-material';
import { purchasesAPI, productsAPI, suppliersAPI } from '../services/api';
import { format } from 'date-fns';

const Purchases = ({ onNotification }) => {
  const theme = useTheme();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ supplier: '', product: '', purchaseDate: new Date().toISOString().split('T')[0], quantity: '', purchasePrice: '', discount: '0', mrp: '', expiryDate: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, pr, s] = await Promise.all([purchasesAPI.getAll(), productsAPI.getAll(), suppliersAPI.getAll()]);
      setPurchases(p.data); setProducts(pr.data); setSuppliers(s.data);
    } catch (e) { onNotification('Error loading data', 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const handleSubmit = async () => {
    try {
      if (!formData.supplier || !formData.product || !formData.quantity || !formData.purchasePrice || !formData.mrp) { onNotification('Fill all required fields', 'error'); return; }
      await purchasesAPI.create({ supplier: formData.supplier, purchaseDate: formData.purchaseDate, items: [{ product: formData.product, quantity: parseInt(formData.quantity), purchasePrice: parseFloat(formData.purchasePrice), discount: parseFloat(formData.discount), mrp: parseFloat(formData.mrp), expiryDate: formData.expiryDate || null, remainingQty: parseInt(formData.quantity) }] });
      onNotification('Purchase added', 'success'); setDialogOpen(false); setFormData({ supplier: '', product: '', purchaseDate: new Date().toISOString().split('T')[0], quantity: '', purchasePrice: '', discount: '0', mrp: '', expiryDate: '' }); fetchData();
    } catch (e) { onNotification('Error adding purchase', 'error'); }
  };

  const getExpiryStatus = (d) => { if (!d) return null; const days = Math.ceil((new Date(d) - new Date()) / (1000*60*60*24)); if (days <= 0) return { label: 'Expired', color: 'error' }; if (days <= 7) return { label: `${days}d`, color: 'error' }; if (days <= 30) return { label: `${days}d`, color: 'warning' }; return { label: `${days}d`, color: 'success' }; };
  const filteredPurchases = purchases.filter(p => p.items?.[0]?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PurchaseIcon color="primary" /><Typography variant="h5" fontWeight={700}>Purchases</Typography>
          <Chip label={`${purchases.length} batches`} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600, height: 24 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" sx={{ width: 240 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <Tooltip title="Refresh"><IconButton onClick={fetchData} color="primary"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add Purchase</Button>
        </Box>
      </Box>

      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer><Table>
          <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Date</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Remaining</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Disc</TableCell><TableCell align="right">MRP</TableCell><TableCell>Expiry</TableCell><TableCell>Source</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
          <TableBody>
            {loading ? Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(10).fill(0).map((_, j) => <TableCell key={j}>--</TableCell>)}</TableRow>)
            : filteredPurchases.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                <PurchaseIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>{searchTerm ? 'No matches' : 'No purchases found'}</Typography>
                <Typography variant="caption" color="text.secondary">{!searchTerm && 'Click "Add Purchase" to add inventory'}</Typography>
              </TableCell></TableRow>
            ) : filteredPurchases.map(purchase => {
              const item = purchase.items?.[0];
              const expStatus = getExpiryStatus(item?.expiryDate);
              const isPending = purchase.status === 'Pending Procurement';
              return (
                <TableRow key={purchase._id} hover sx={{ bgcolor: isPending ? alpha('#F59E0B', 0.03) : 'inherit' }}>
                  <TableCell><Typography variant="body2" fontWeight={500}>{item?.product?.name}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{format(new Date(purchase.purchaseDate), 'dd MMM yyyy')}</Typography></TableCell>
                  <TableCell align="right">{item?.quantity}</TableCell>
                  <TableCell align="right"><Typography color={item?.remainingQty <= 10 ? 'error.main' : 'text.primary'} fontWeight={item?.remainingQty <= 10 ? 700 : 400}>{item?.remainingQty}</Typography></TableCell>
                  <TableCell align="right">₹{item?.purchasePrice}</TableCell>
                  <TableCell align="right">{item?.discount}%</TableCell>
                  <TableCell align="right">₹{item?.mrp}</TableCell>
                  <TableCell>{item?.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yy') : 'N/A'}</TableCell>
                  <TableCell><Chip label={purchase.source === 'Requisition' ? 'Requisition' : 'Manual'} color={purchase.source === 'Requisition' ? 'info' : 'default'} size="small" variant="outlined" sx={{ height: 22 }} /></TableCell>
                  <TableCell>
                    {isPending ? <Chip label="Pending Procurement" color="warning" size="small" sx={{ fontWeight: 600 }} />
                    : purchase.status === 'Completed' ? <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 600 }} />
                    : purchase.status === 'Cancelled' ? <Chip label="Cancelled" color="error" size="small" />
                    : expStatus ? <Chip label={expStatus.label} color={expStatus.color} size="small" icon={expStatus.color === 'error' ? <WarningIcon sx={{ fontSize: '0.875rem !important' }} /> : undefined} /> : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Purchase</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Autocomplete options={suppliers} getOptionLabel={o => o.supplierName} value={suppliers.find(s => s._id === formData.supplier) || null} onChange={(_, nv) => handleInputChange('supplier', nv?._id || '')} renderInput={p => <TextField {...p} label="Supplier" required />} />
            <Autocomplete options={products} getOptionLabel={o => o.name} value={products.find(p => p._id === formData.product) || null} onChange={(_, nv) => handleInputChange('product', nv?._id || '')} renderInput={p => <TextField {...p} label="Product" required />} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Purchase Date" type="date" value={formData.purchaseDate} onChange={(e) => handleInputChange('purchaseDate', e.target.value)} InputLabelProps={{ shrink: true }} required />
              <TextField fullWidth label="Quantity" type="number" value={formData.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} required />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Price/Unit" type="number" value={formData.purchasePrice} onChange={(e) => handleInputChange('purchasePrice', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} required />
              <TextField fullWidth label="Discount" type="number" value={formData.discount} onChange={(e) => handleInputChange('discount', e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="MRP/Unit" type="number" value={formData.mrp} onChange={(e) => handleInputChange('mrp', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} required />
              <TextField fullWidth label="Expiry Date" type="date" value={formData.expiryDate} onChange={(e) => handleInputChange('expiryDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">Cancel</Button><Button onClick={handleSubmit} variant="contained" startIcon={<AddIcon />}>Add Purchase</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases;
