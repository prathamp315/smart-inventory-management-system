import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Chip, useTheme } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, AccountTree as BOMIcon } from "@mui/icons-material";
import { bomAPI, productsAPI } from "../services/api";

const BOM = ({ onNotification }) => {
  const theme = useTheme();
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [finishedProduct, setFinishedProduct] = useState("");
  const [materials, setMaterials] = useState([{ product: "", quantityRequired: "" }]);
  const finishedProducts = products.filter(p => p.itemType === "Finished");
  const rawProducts = products.filter(p => p.itemType === "Raw");

  const fetchData = async () => { try { const [p, b] = await Promise.all([productsAPI.getAll(), bomAPI.getAll()]); setProducts(p.data); setBoms(b.data); } catch (e) {} };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      if (!finishedProduct) { onNotification("Select a finished product", "error"); return; }
      const valid = materials.filter(m => m.product && m.quantityRequired > 0);
      if (!valid.length) { onNotification("Add at least one raw material", "error"); return; }
      await bomAPI.create({ finishedProduct, materials: valid.map(m => ({ product: m.product, quantityRequired: Number(m.quantityRequired) })) });
      onNotification("BOM created", "success"); setDialogOpen(false); setFinishedProduct(""); setMaterials([{ product: "", quantityRequired: "" }]); fetchData();
    } catch (err) { onNotification(err.response?.data?.error || "Error creating BOM", "error"); }
  };

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><BOMIcon color="primary" /><Typography variant="h5" fontWeight={700}>Bill of Materials</Typography></Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>New BOM</Button>
      </Box>
      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer><Table>
          <TableHead><TableRow><TableCell>Finished Product</TableCell><TableCell>Raw Materials</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
          <TableBody>
            {boms.map(bom => (
              <TableRow key={bom._id} hover>
                <TableCell><Chip label={bom.finishedProduct?.name || "Unknown"} color="success" size="small" sx={{ fontWeight: 600 }} /></TableCell>
                <TableCell><Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>{bom.materials?.map((mat, i) => <Chip key={i} label={`${mat.product?.name || "?"} ×${mat.quantityRequired}`} size="small" variant="outlined" />)}</Box></TableCell>
                <TableCell><Typography variant="caption">{bom.createdAt ? new Date(bom.createdAt).toLocaleDateString() : "—"}</Typography></TableCell>
              </TableRow>
            ))}
            {boms.length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 6 }}>
              <BOMIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>No BOMs defined yet</Typography>
              <Typography variant="caption" color="text.secondary">Click "New BOM" to create one</Typography>
            </TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Bill of Materials</DialogTitle>
        <DialogContent>
          <TextField select fullWidth margin="normal" label="Finished Product" value={finishedProduct} onChange={(e) => setFinishedProduct(e.target.value)}>
            {finishedProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
          </TextField>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Raw Materials</Typography>
          {materials.map((mat, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
              <TextField select label="Material" value={mat.product} onChange={(e) => { const u = [...materials]; u[i].product = e.target.value; setMaterials(u); }} sx={{ flex: 2 }} size="small">
                {rawProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField label="Qty" type="number" value={mat.quantityRequired} onChange={(e) => { const u = [...materials]; u[i].quantityRequired = e.target.value; setMaterials(u); }} sx={{ flex: 1 }} size="small" />
              {materials.length > 1 && <IconButton size="small" color="error" onClick={() => setMaterials(materials.filter((_, j) => j !== i))}><DeleteIcon fontSize="small" /></IconButton>}
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => setMaterials([...materials, { product: "", quantityRequired: "" }])} sx={{ mt: 1 }}>Add Material</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)} variant="outlined" color="inherit">Cancel</Button><Button variant="contained" onClick={handleSubmit}>Save BOM</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default BOM;
