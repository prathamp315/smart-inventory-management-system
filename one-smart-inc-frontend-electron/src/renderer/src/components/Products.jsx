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
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { productsAPI } from '../services/api';

const Products = ({ onNotification }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    specific: {
      flavor: '',
      color: '',
      weight: '',
      volume: '',
    },
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      onNotification('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        onNotification('Product name is required', 'error');
        return;
      }

      await productsAPI.create(formData);
      onNotification('Product created successfully', 'success');
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      onNotification('Error creating product', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specific: {
        flavor: '',
        color: '',
        weight: '',
        volume: '',
      },
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderLoadingSkeletons = () => (
    Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell><Skeleton variant="text" width="100%" height={30} /></TableCell>
        <TableCell align="center"><Skeleton variant="circular" width={30} height={30} /></TableCell>
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
            placeholder="Search products..."
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
            <Tooltip title="Refresh products">
              <IconButton onClick={fetchProducts} color="primary" size="large">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              size="large"
            >
              Add Product
            </Button>
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
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Flavor</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Weight</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Volume</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                renderLoadingSkeletons()
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {product.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.specific.flavor || '—'}</TableCell>
                    <TableCell>{product.specific.color || '—'}</TableCell>
                    <TableCell>{product.specific.weight || '—'}</TableCell>
                    <TableCell>{product.specific.volume || '—'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit product">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No products match your search' : 'No products found. Click "Add Product" to create your first product.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Product Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 'none',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle>Add New Product</DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, m: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              autoFocus
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Flavor"
                  value={formData.specific.flavor}
                  onChange={(e) => handleInputChange('specific.flavor', e.target.value)}
                  placeholder="e.g., Mango, Vanilla"
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Color"
                  value={formData.specific.color}
                  onChange={(e) => handleInputChange('specific.color', e.target.value)}
                  placeholder="e.g., Red, Blue"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Weight"
                  value={formData.specific.weight}
                  onChange={(e) => handleInputChange('specific.weight', e.target.value)}
                  placeholder="e.g., 500g, 1kg"
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Volume"
                  value={formData.specific.volume}
                  onChange={(e) => handleInputChange('specific.volume', e.target.value)}
                  placeholder="e.g., 500ml, 1L"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;

