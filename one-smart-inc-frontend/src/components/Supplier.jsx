import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, useTheme } from "@mui/material";
import { Add as AddIcon, LocalShipping as SupplierIcon } from "@mui/icons-material";
import { suppliersAPI } from "../services/api";

export default function Supplier({ onNotification }) {
  const theme = useTheme();
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplierName: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "" });

  useEffect(() => { fetchSuppliers(); }, []);
  const fetchSuppliers = async () => { try { const r = await suppliersAPI.getAll(); setSuppliers(r.data); } catch (e) { onNotification?.("Error fetching suppliers", "error"); } };
  const handleSubmit = async () => {
    try { await suppliersAPI.create(form); setForm({ supplierName: "", contactPerson: "", phone: "", email: "", address: "", gstNumber: "" }); setOpen(false); fetchSuppliers(); onNotification?.("Supplier added", "success"); }
    catch (e) { onNotification?.("Error adding supplier", "error"); }
  };

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><SupplierIcon color="primary" /><Typography variant="h5" fontWeight={700}>Suppliers</Typography></Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Supplier</Button>
      </Box>
      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer><Table>
          <TableHead><TableRow><TableCell>Supplier Name</TableCell><TableCell>Contact Person</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Address</TableCell><TableCell>GST Number</TableCell></TableRow></TableHead>
          <TableBody>
            {suppliers.map(s => <TableRow key={s._id} hover><TableCell><Typography variant="body2" fontWeight={500}>{s.supplierName}</Typography></TableCell><TableCell>{s.contactPerson || "-"}</TableCell><TableCell>{s.phone || "-"}</TableCell><TableCell>{s.email || "-"}</TableCell><TableCell>{s.address || "-"}</TableCell><TableCell>{s.gstNumber || "-"}</TableCell></TableRow>)}
            {suppliers.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
              <SupplierIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>No suppliers found</Typography>
              <Typography variant="caption" color="text.secondary">Add your first supplier to get started</Typography>
            </TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Supplier Name" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} required />
            <TextField label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <TextField label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)} variant="outlined" color="inherit">Cancel</Button><Button variant="contained" onClick={handleSubmit} disabled={!form.supplierName}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
