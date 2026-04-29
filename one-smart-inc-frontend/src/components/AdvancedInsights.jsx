import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Chip, Card, CardContent, Grid, alpha, useTheme, LinearProgress, MenuItem, TextField, CircularProgress, Tooltip } from "@mui/material";
import { CompareArrows, AttachMoney, Favorite, Factory, LocalShipping, PriorityHigh } from "@mui/icons-material";
import { insightsAPI, productsAPI } from "../services/api";

const Section = ({ icon, title, children }) => {
  const t = useTheme();
  return (
    <Paper sx={{ p: 2.5, mb: 3, border: `1px solid ${t.palette.divider}`, boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>{icon}<Typography variant="h6" fontWeight={700}>{title}</Typography></Box>
      {children}
    </Paper>
  );
};

export default function AdvancedInsights() {
  const theme = useTheme();
  const [ds, setDs] = useState([]);
  const [health, setHealth] = useState(null);
  const [plan, setPlan] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [costing, setCosting] = useState(null);
  const [costProduct, setCostProduct] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, h, p, s, pr] = await Promise.all([
          insightsAPI.getDemandSupply(), insightsAPI.getHealth(),
          insightsAPI.getProductionPlan(), insightsAPI.getSupplierPerformance(),
          productsAPI.getAll()
        ]);
        setDs(d.data || []); setHealth(h.data); setPlan(p.data || []);
        setSuppliers(s.data || []); setProducts(pr.data || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const fetchCost = async (id) => {
    setCostProduct(id);
    if (!id) { setCosting(null); return; }
    try { const r = await insightsAPI.getCosting(id); setCosting(r.data); } catch (e) { setCosting(null); }
  };

  const statusColor = { Shortage: 'error', "At Risk": 'warning', Balanced: 'success' };
  const supColor = { Excellent: 'success', Good: 'info', Average: 'warning', Poor: 'error' };
  const a = alpha;

  if (loading) return <LinearProgress sx={{ borderRadius: 2, my: 2 }} />;

  const finishedProducts = products.filter(p => p.itemType === 'Finished');

  const HealthGauge = ({ score, label, color }) => (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={score} size={60} thickness={5} sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" fontWeight={800}>{score}</Typography>
        </Box>
      </Box>
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
    </Box>
  );

  return (
    <Box>
      {/* HEALTH SCORE */}
      {health && (
        <Section icon={<Favorite sx={{ color: '#EF4444' }} />} title={`System Health: ${health.healthScore}%`}>
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={health.healthScore} sx={{ height: 10, borderRadius: 5, bgcolor: a(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 5, background: health.healthScore > 75 ? 'linear-gradient(90deg, #22C55E, #4ADE80)' : health.healthScore > 50 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)' } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <HealthGauge score={health.breakdown.inventory} label="Inventory" color="#4F46E5" />
            <HealthGauge score={health.breakdown.sales} label="Sales" color="#22C55E" />
            <HealthGauge score={health.breakdown.production} label="Production" color="#8B5CF6" />
            <HealthGauge score={health.breakdown.procurement} label="Procurement" color="#F59E0B" />
          </Box>
        </Section>
      )}

      {/* DEMAND vs SUPPLY */}
      {ds.length > 0 && (
        <Section icon={<CompareArrows color="primary" />} title="Demand vs Supply">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ds.slice(0, 8).map((d, i) => (
              <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { bgcolor: a(theme.palette.primary.main, 0.03) } }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{d.product}</Typography>
                  <Typography variant="caption" color="text.secondary">Demand: {d.demandPerDay}/day | Stock: {d.currentStock}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={d.status} color={statusColor[d.status] || 'default'} size="small" sx={{ fontWeight: 600 }} />
                  <Typography variant="caption" display="block" color={d.daysCoverage <= 5 ? 'error.main' : 'text.secondary'} fontWeight={600}>
                    {d.daysCoverage >= 999 ? 'No demand' : `${d.daysCoverage} days coverage`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Section>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* PRODUCTION PLAN */}
        <Grid item xs={12} md={6}>
          <Section icon={<Factory sx={{ color: '#8B5CF6' }} />} title="Production Suggestions">
            {plan.length === 0 ? <Typography color="text.secondary" variant="body2">No finished products to plan</Typography>
            : plan.map((p, i) => (
              <Box key={i} sx={{ p: 1.5, mb: 1, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>{p.product}</Typography>
                    <Typography variant="caption" color="text.secondary">Stock: {p.currentStock} | Demand: {p.demandPerDay}/day</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight={800} color={p.suggestedProduction > 0 ? 'primary.main' : 'success.main'}>{p.suggestedProduction}</Typography>
                    <Typography variant="caption" color="text.secondary">units to produce</Typography>
                  </Box>
                </Box>
                {p.suggestedProduction > 0 && <Chip label={p.feasible ? '✓ Materials available' : '⚠ Materials shortage'} size="small" color={p.feasible ? 'success' : 'warning'} variant="outlined" sx={{ mt: 1, fontWeight: 600 }} />}
              </Box>
            ))}
          </Section>
        </Grid>

        {/* SUPPLIER PERFORMANCE */}
        <Grid item xs={12} md={6}>
          <Section icon={<LocalShipping sx={{ color: '#06B6D4' }} />} title="Supplier Performance">
            {suppliers.length === 0 ? <Typography color="text.secondary" variant="body2">No suppliers</Typography>
            : suppliers.map((s, i) => (
              <Box key={i} sx={{ p: 1.5, mb: 1, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{s.supplier}</Typography>
                  <Typography variant="caption" color="text.secondary">Purchased: {s.totalPurchased} | Returns: {s.totalReturned} ({s.returnRate}%)</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight={800} color={s.score >= 90 ? 'success.main' : s.score >= 75 ? 'info.main' : 'warning.main'}>{s.score}%</Typography>
                  <Chip label={s.status} color={supColor[s.status]} size="small" sx={{ fontWeight: 600 }} />
                </Box>
              </Box>
            ))}
          </Section>
        </Grid>
      </Grid>

      {/* COST ANALYSIS */}
      <Section icon={<AttachMoney sx={{ color: '#22C55E' }} />} title="Cost Analysis">
        <TextField select label="Select Finished Product" value={costProduct} onChange={(e) => fetchCost(e.target.value)} size="small" sx={{ minWidth: 280, mb: 2 }}>
          <MenuItem value="">Select...</MenuItem>
          {finishedProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        {costing && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[{ label: 'Cost/Unit', value: `₹${costing.costPerUnit}`, color: '#4F46E5' }, { label: 'MRP', value: `₹${costing.mrp}`, color: '#22C55E' }, { label: 'Profit', value: `₹${costing.profit}`, color: costing.profit >= 0 ? '#22C55E' : '#EF4444' }, { label: 'Margin', value: `${costing.margin}%`, color: '#8B5CF6' }].map((c, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', textAlign: 'center' }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="h5" fontWeight={800} sx={{ color: c.color }}>{c.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {costing.breakdown?.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {costing.breakdown.map((b, i) => (
                  <Box key={i} sx={{ p: 1, borderRadius: 1, display: 'flex', justifyContent: 'space-between', bgcolor: a(theme.palette.primary.main, 0.03) }}>
                    <Typography variant="body2">{b.material} × {b.qtyRequired}</Typography>
                    <Typography variant="body2" fontWeight={600}>₹{b.unitPrice} → ₹{b.cost}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Section>
    </Box>
  );
}
