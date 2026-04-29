import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Card, CardContent, InputAdornment, Tooltip, Skeleton, Chip, MenuItem, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon, Search as SearchIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { productsAPI, inventoryAPI } from '../services/api';

const Products = ({ onNotification }) => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [lowStockMap, setLowStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formData, setFormData] = useState({ name: '', itemType: 'Raw', specific: { flavor: '', color: '', weight: '', volume: '' } });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsResponse = await productsAPI.getAll();
      setProducts(productsResponse.data);
      try {
        const inventoryResponse = await inventoryAPI.getSummary();
        const inventorySummary = inventoryResponse?.data || [];
        const lowStockProducts = {};
        inventorySummary.forEach(item => { if (item.lowStock) lowStockProducts[item.productId] = true; });
        setLowStockMap(lowStockProducts);
      } catch (e) { console.warn("Inventory summary failed:", e); }
    } catch (error) { console.error('Error:', error); onNotification('Error loading products', 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) { onNotification('Product name is required', 'error'); return; }
      if (editMode) { await productsAPI.update(selectedProductId, formData); onNotification('Product updated', 'success'); }
      else { await productsAPI.create(formData); onNotification('Product created', 'success'); }
      setDialogOpen(false); resetForm(); fetchProducts();
    } catch (error) { onNotification('Error saving product', 'error'); }
  };

  const resetForm = () => { setFormData({ name: '', itemType: 'Raw', specific: { flavor: '', color: '', weight: '', volume: '' } }); setEditMode(false); setSelectedProductId(null); };
  const handleEdit = (product) => { setFormData({ name: product.name, itemType: product.itemType || 'Raw', specific: { flavor: product.specific?.flavor || '', color: product.specific?.color || '', weight: product.specific?.weight || '', volume: product.specific?.volume || '' } }); setSelectedProductId(product._id); setEditMode(true); setDialogOpen(true); };
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box className="animate-fadeIn">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Products</Typography>
          <Chip label={`${products.length} items`} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600, height: 24 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            sx={{ width: 260 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <Tooltip title="Refresh"><IconButton onClick={fetchProducts} color="primary"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add Product</Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Product Name</TableCell><TableCell>Type</TableCell><TableCell>Flavor</TableCell><TableCell>Color</TableCell><TableCell>Weight</TableCell><TableCell>Volume</TableCell><TableCell align="center">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading ? Array(5).fill(0).map((_, i) => (<TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}</TableRow>))
              : filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary" fontWeight={500}>{searchTerm ? 'No products match your search' : 'No products found'}</Typography>
                  <Typography variant="caption" color="text.secondary">{!searchTerm && 'Click "Add Product" to create your first product'}</Typography>
                </TableCell></TableRow>
              ) : filteredProducts.map(product => (
                <TableRow key={product._id} hover sx={{ bgcolor: lowStockMap[product._id] ? alpha('#EF4444', 0.03) : 'inherit' }}>
                  <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{product.name}</Typography>
                    {lowStockMap[product._id] && <Chip label="Low Stock" color="error" size="small" sx={{ height: 20, fontSize: '0.625rem' }} />}
                  </Box></TableCell>
                  <TableCell><Chip label={product.itemType || 'Raw'} color={product.itemType === 'Finished' ? 'success' : 'default'} size="small" variant="outlined" sx={{ height: 22 }} /></TableCell>
                  <TableCell>{product.specific?.flavor || '—'}</TableCell>
                  <TableCell>{product.specific?.color || '—'}</TableCell>
                  <TableCell>{product.specific?.weight || '—'}</TableCell>
                  <TableCell>{product.specific?.volume || '—'}</TableCell>
                  <TableCell align="center"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(product)}><EditIcon fontSize="small" /></IconButton></Tooltip></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField fullWidth label="Product Name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required autoFocus />
            <TextField select fullWidth label="Item Type" value={formData.itemType} onChange={(e) => handleInputChange('itemType', e.target.value)}>
              <MenuItem value="Raw">Raw Material</MenuItem><MenuItem value="Finished">Finished Product</MenuItem>
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Flavor" value={formData.specific.flavor} onChange={(e) => handleInputChange('specific.flavor', e.target.value)} placeholder="e.g., Mango" />
              <TextField fullWidth label="Color" value={formData.specific.color} onChange={(e) => handleInputChange('specific.color', e.target.value)} placeholder="e.g., Red" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Weight" value={formData.specific.weight} onChange={(e) => handleInputChange('specific.weight', e.target.value)} placeholder="e.g., 500g" />
              <TextField fullWidth label="Volume" value={formData.specific.volume} onChange={(e) => handleInputChange('specific.volume', e.target.value)} placeholder="e.g., 1L" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => { setDialogOpen(false); resetForm(); }} variant="outlined" color="inherit">Cancel</Button><Button onClick={handleSubmit} variant="contained">{editMode ? 'Update' : 'Add Product'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
