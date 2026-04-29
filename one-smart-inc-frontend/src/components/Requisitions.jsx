import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip, alpha, useTheme } from "@mui/material";
import { Add as AddIcon, Assignment as ReqIcon, CheckCircle, Cancel, PriorityHigh } from "@mui/icons-material";
import { requisitionAPI, productsAPI, insightsAPI } from "../services/api";

const Requisitions = ({ onNotification }) => {
  const theme = useTheme();
  const [requisitions, setRequisitions] = useState([]);
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ product: "", quantity: "", requestedBy: "", justification: "" });
  const [priorities, setPriorities] = useState([]);

  const fetchData = async () => {
    try { const prodRes = await productsAPI.getAll(); setProducts(prodRes.data); } catch (e) {}
    try { const reqRes = await requisitionAPI.getAll(); setRequisitions(reqRes.data); } catch (e) {}
    try { const pr = await insightsAPI.getRequisitionPriority(); setPriorities(pr.data || []); } catch (e) {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.product || !formData.quantity || !formData.requestedBy) { onNotification("Please fill all required fields", "error"); return; }
      await requisitionAPI.create(formData);
      onNotification("Requisition created", "success");
      setDialogOpen(false);
      setFormData({ product: "", quantity: "", requestedBy: "", justification: "" });
      fetchData();
    } catch (err) { onNotification(JSON.stringify(err.response?.data), "error"); }
  };

  const handleApprove = async (id) => {
    try { const res = await requisitionAPI.approve(id); onNotification(res.data?.message || "Requisition approved", "success"); fetchData(); }
    catch (err) { onNotification(err.response?.data?.error || "Error approving", "error"); }
  };

  const handleReject = async (id) => {
    try { await requisitionAPI.reject(id); onNotification("Requisition rejected", "info"); fetchData(); }
    catch (err) { onNotification(err.response?.data?.error || "Error rejecting", "error"); }
  };

  const statusColors = { Approved: 'success', Rejected: 'error', Pending: 'warning' };

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReqIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Purchase Requisitions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>New Requisition</Button>
      </Box>

      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer><Table>
          <TableHead><TableRow>
            <TableCell>Requisition No</TableCell><TableCell>Product</TableCell><TableCell>Quantity</TableCell><TableCell>Requested By</TableCell><TableCell>Priority</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {(Array.isArray(requisitions) ? requisitions : []).length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <ReqIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>No requisitions found</Typography>
                <Typography variant="caption" color="text.secondary">Start by creating one</Typography>
              </TableCell></TableRow>
            ) : (Array.isArray(requisitions) ? requisitions : []).map((req) => (
              <TableRow key={req._id} hover sx={{ bgcolor: req.status === 'Pending' ? alpha('#F59E0B', 0.03) : 'inherit' }}>
                <TableCell><Typography variant="body2" fontWeight={500}>{req.requisitionNumber}</Typography></TableCell>
                <TableCell>{req.product?.name}</TableCell>
                <TableCell>{req.quantity}</TableCell>
                <TableCell>{req.requestedBy}</TableCell>
                <TableCell>{(() => { const p = priorities.find(pr => pr.requisitionId === req._id); if (!p) return <Chip label="—" size="small" />; const icons = { High: '🔥', Medium: '⚠️', Low: '✔' }; return <><Chip label={`${icons[p.priority] || ''} ${p.priority}`} color={p.color} size="small" sx={{ fontWeight: 600 }} />{p.daysLeft < 999 && <Typography variant="caption" display="block" color="text.secondary">{p.daysLeft}d left</Typography>}</>; })()}</TableCell>
                <TableCell><Chip label={req.status} color={statusColors[req.status] || 'default'} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                <TableCell>
                  {req.status === "Pending" && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" color="success" startIcon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} onClick={() => handleApprove(req._id)} sx={{ fontSize: '0.75rem', py: 0.5 }}>Approve</Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<Cancel sx={{ fontSize: '1rem !important' }} />} onClick={() => handleReject(req._id)} sx={{ fontSize: '0.75rem', py: 0.5 }}>Reject</Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Purchase Requisition</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField select fullWidth label="Product" value={formData.product} onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))} SelectProps={{ native: true }}>
              <option value="" />{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </TextField>
            <TextField fullWidth label="Quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} />
            <TextField fullWidth label="Requested By" value={formData.requestedBy} onChange={(e) => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))} />
            <TextField fullWidth label="Justification" multiline rows={3} value={formData.justification} onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">Cancel</Button><Button variant="contained" onClick={handleSubmit}>Submit</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requisitions;