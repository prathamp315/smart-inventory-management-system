import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Chip, Card, CardContent, alpha, useTheme, Stepper, Step, StepLabel } from "@mui/material";
import { PrecisionManufacturing as MfgIcon, PlayArrow, CheckCircle, Cancel, Warning as WarningIcon } from "@mui/icons-material";
import { manufacturingAPI, productsAPI } from "../services/api";

const statusSteps = ['Planned', 'InProgress', 'Completed'];
const statusMap = { Planned: 0, InProgress: 1, Completed: 2, Cancelled: -1 };

const Manufacturing = ({ onNotification }) => {
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState({});

  const finishedProducts = products.filter(p => p.itemType === "Finished");

  const fetchData = async () => {
    try { const [prodRes, ordersRes] = await Promise.all([productsAPI.getAll(), manufacturingAPI.getAll()]); setProducts(prodRes.data); setOrders(ordersRes.data); } catch (e) {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      if (!selectedProduct || !quantity || quantity <= 0) { onNotification("Select a product and valid quantity", "error"); return; }
      await manufacturingAPI.create({ product: selectedProduct, quantity: Number(quantity) });
      onNotification("Manufacturing order created (Planned)", "success"); setSelectedProduct(""); setQuantity(""); fetchData();
    } catch (err) { onNotification(err.response?.data?.error || "Error creating order", "error"); }
  };

  const handleAction = async (id, action) => {
    try {
      setLoading(prev => ({ ...prev, [id]: action }));
      await manufacturingAPI[action](id);
      const msgs = { start: "Production started", complete: "Production completed. Materials deducted.", cancel: "Order cancelled" };
      onNotification(msgs[action], "success"); fetchData();
    } catch (err) { onNotification(err.response?.data?.error || `Error: ${action}`, "error"); }
    finally { setLoading(prev => ({ ...prev, [id]: null })); }
  };

  const statusColors = { Completed: 'success', InProgress: 'warning', Cancelled: 'error', Planned: 'default' };

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <MfgIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Manufacturing</Typography>
      </Box>

      {/* Create Order */}
      <Card sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Create Manufacturing Order</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
            <TextField select label="Finished Product" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} sx={{ minWidth: 250 }}>
              {finishedProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} sx={{ width: 150 }} />
            <Button variant="contained" onClick={handleSubmit} size="large">Create Order</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={600}>Manufacturing Orders</Typography>
        </Box>
        <TableContainer><Table>
          <TableHead><TableRow>
            <TableCell>Order ID</TableCell><TableCell>Product</TableCell><TableCell>Quantity</TableCell><TableCell>Lifecycle</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <MfgIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>No manufacturing orders yet</Typography>
                <Typography variant="caption" color="text.secondary">Create your first order above</Typography>
              </TableCell></TableRow>
            ) : orders.map(order => {
              const isCancelled = order.status === 'Cancelled';
              const activeStep = statusMap[order.status] ?? 0;
              const hasWarning = order.insufficientMaterials;
              return (
                <TableRow key={order._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>{order._id?.slice(-6).toUpperCase()}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{order.product?.name || "Unknown"}</Typography>
                    {hasWarning && <Chip icon={<WarningIcon sx={{ fontSize: '0.875rem !important' }} />} label="Insufficient raw materials" size="small" color="warning" sx={{ mt: 0.5, height: 20, fontSize: '0.625rem' }} />}
                    {order.autoRequisitionCreated && <Chip label="Auto Requisition Created" size="small" color="info" variant="outlined" sx={{ mt: 0.5, ml: 0.5, height: 20, fontSize: '0.625rem' }} />}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    {!isCancelled ? (
                      <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.625rem' }, '& .MuiStepIcon-root': { fontSize: '1rem' } }}>
                        {statusSteps.map(s => <Step key={s} completed={statusSteps.indexOf(s) < activeStep}><StepLabel>{s === 'InProgress' ? 'In Progress' : s}</StepLabel></Step>)}
                      </Stepper>
                    ) : <Typography variant="caption" color="error.main" fontWeight={600}>Cancelled</Typography>}
                  </TableCell>
                  <TableCell><Chip label={order.status === 'InProgress' ? 'In Progress' : order.status} color={statusColors[order.status]} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                  <TableCell><Typography variant="caption">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</Typography></TableCell>
                  <TableCell>
                    {order.status === "Planned" && <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" startIcon={<PlayArrow sx={{ fontSize: '1rem !important' }} />} disabled={!!loading[order._id]} onClick={() => handleAction(order._id, 'start')} sx={{ fontSize: '0.75rem' }}>{loading[order._id] === 'start' ? '...' : 'Start'}</Button>
                      <Button size="small" variant="outlined" color="error" disabled={!!loading[order._id]} onClick={() => handleAction(order._id, 'cancel')} sx={{ fontSize: '0.75rem' }}>Cancel</Button>
                    </Box>}
                    {order.status === "InProgress" && <Button size="small" variant="contained" color="success" startIcon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} disabled={!!loading[order._id]} onClick={() => handleAction(order._id, 'complete')} sx={{ fontSize: '0.75rem' }}>{loading[order._id] === 'complete' ? '...' : 'Complete'}</Button>}
                    {order.status === "Completed" && <Typography variant="body2" color="success.main" fontWeight={600}>✓ Done</Typography>}
                    {order.status === "Cancelled" && <Typography variant="body2" color="error.main" fontWeight={600}>✗ Cancelled</Typography>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></TableContainer>
      </Paper>
    </Box>
  );
};

export default Manufacturing;
