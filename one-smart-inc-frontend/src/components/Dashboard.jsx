import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Grid, Paper, Typography, Card, CardContent, alpha, useTheme,
  Skeleton, Button, IconButton, Tooltip, LinearProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from "@mui/material";
import {
  TrendingUp as SalesIcon, Inventory as InventoryIcon, ShoppingCart as PurchaseIcon,
  Warning as WarningIcon, Refresh as RefreshIcon, Analytics as AnalyticsIcon,
  Speed as SpeedIcon, RemoveShoppingCart as StockoutIcon, CheckCircle as ApprovalIcon,
  BarChart as AOVIcon, ArrowUpward, ArrowDownward, Science as SimulateIcon,
  PlayCircle, SkipNext, Close, RestartAlt,
} from "@mui/icons-material";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { purchasesAPI, billsAPI, kpiAPI, demoAPI, productsAPI, insightsAPI } from "../services/api";
import { format } from "date-fns";
import CommandCenter from "./CommandCenter";

const COLORS = ["#4F46E5","#22C55E","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];

// Demo tour steps
const DEMO_STEPS = [
  { id: 0, label: "Recommended Actions", desc: "These are system-generated priority actions you should take immediately.", section: "cc-recommendations" },
  { id: 1, label: "Exceptions", desc: "Critical alerts — low stock, expiring items, pending approvals.", section: "cc-exceptions" },
  { id: 2, label: "Demand vs Supply & Risk", desc: "Analytics panels showing product health and top risk products.", section: "cc-demand-supply" },
  { id: 3, label: "Inventory Aging", desc: "See how long stock has been sitting — old inventory risks waste.", section: "cc-aging" },
  { id: 4, label: "Root Cause & Insights", desc: "AI-powered explanations of WHY issues happen and weekly summary.", section: "cc-root-cause" },
];

export default function Dashboard({ onNotification }) {
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, totalPurchases: 0, expiringItems: 0 });
  const [bills, setBills] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  // Simulation
  const [simOpen, setSimOpen] = useState(false);
  const [simProduct, setSimProduct] = useState("");
  const [simQty, setSimQty] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  // Demo mode
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pu, ex, bl, pr, kp] = await Promise.all([
        purchasesAPI.getAll().catch(() => ({ data: [] })),
        purchasesAPI.getExpiring().catch(() => ({ data: [] })),
        billsAPI.getAll().catch(() => ({ data: [] })),
        productsAPI.getAll().catch(() => ({ data: [] })),
        kpiAPI.getAll().catch(() => ({ data: null })),
      ]);
      setBills(bl.data || []);
      setProducts(pr.data || []);
      setKpis(kp.data);
      const totalSales = (bl.data || []).reduce((s, b) => s + b.totalAmount, 0);
      setStats({ totalSales, totalProducts: (pr.data || []).length, totalPurchases: (pu.data || []).length, expiringItems: (ex.data || []).length });
    } catch (e) { onNotification?.("Error loading dashboard", "error"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSimulate = async () => {
    if (!simProduct || !simQty) return;
    try {
      setSimLoading(true);
      const r = await insightsAPI.simulate({ productId: simProduct, quantity: Number(simQty) });
      setSimResult(r.data);
    } catch (e) { onNotification?.(e.response?.data?.error || "Simulation error", "error"); setSimResult(null); }
    setSimLoading(false);
  };

  const startDemo = async () => {
    setDemoLoading(true);
    try { await demoAPI.seed(); onNotification?.("Demo data loaded!", "success"); } catch (e) {}
    setDemoLoading(false);
    setDemoActive(true);
    setDemoStep(0);
    await fetchData();
  };

  const nextDemoStep = () => {
    if (demoStep < DEMO_STEPS.length - 1) setDemoStep(s => s + 1);
    else endDemo();
  };

  const endDemo = () => { setDemoActive(false); setDemoStep(-1); };

  const revenueData = useMemo(() => {
    const g = {};
    bills.forEach(b => { const d = format(new Date(b.createdAt), "MMM dd"); g[d] = (g[d] || 0) + b.totalAmount; });
    return Object.entries(g).slice(-7).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
  }, [bills]);

  const paymentData = useMemo(() => {
    const g = {};
    bills.forEach(b => { g[b.paymentMethod] = (g[b.paymentMethod] || 0) + 1; });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [bills]);

  const finishedProducts = products.filter(p => p.itemType === "Finished");

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={220} height={36} sx={{ mb: 1 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>{[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      {[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={150} sx={{ mb: 2, borderRadius: 3 }} />)}
    </Box>
  );

  return (
    <Box className="animate-fadeIn">
      {/* ── Demo Tour Banner ── */}
      {demoActive && (
        <Paper sx={{
          p: 2, mb: 2.5, border: "2px solid #4F46E5", borderRadius: 3,
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          color: "#fff", position: "sticky", top: 8, zIndex: 10,
          boxShadow: "0 8px 32px rgba(79,70,229,0.35)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <PlayCircle sx={{ fontSize: "1.5rem" }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                🎬 Demo Mode — Step {demoStep + 1}/{DEMO_STEPS.length}: {DEMO_STEPS[demoStep]?.label}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{DEMO_STEPS[demoStep]?.desc}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {demoStep < DEMO_STEPS.length - 1 ? (
                <Button variant="contained" size="small" onClick={nextDemoStep} startIcon={<SkipNext />}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" size="small" onClick={endDemo}
                  sx={{ bgcolor: "#22C55E", "&:hover": { bgcolor: "#16A34A" } }}>
                  Finish ✓
                </Button>
              )}
              <IconButton size="small" onClick={endDemo} sx={{ color: "rgba(255,255,255,0.7)" }}><Close fontSize="small" /></IconButton>
            </Box>
          </Box>
          {/* Step progress */}
          <Box sx={{ display: "flex", gap: 0.75, mt: 1.5 }}>
            {DEMO_STEPS.map((s, i) => (
              <Box key={i} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: i <= demoStep ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "all 0.3s" }} />
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Welcome back, {user?.name?.split(" ")[0] || "User"} 👋</Typography>
          <Typography variant="body2" color="text.secondary">{format(new Date(), "EEEE, MMMM d")}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" size="small" startIcon={<SimulateIcon />} onClick={() => setSimOpen(true)}>Simulate</Button>
          {!demoActive ? (
            <Button variant="contained" size="small" startIcon={demoLoading ? null : <PlayCircle />}
              onClick={startDemo} disabled={demoLoading}
              sx={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", "&:hover": { background: "linear-gradient(135deg, #4338CA, #6D28D9)" } }}>
              {demoLoading ? "Loading..." : "🎬 Demo Mode"}
            </Button>
          ) : (
            <Button variant="outlined" size="small" startIcon={<RestartAlt />} onClick={endDemo} color="secondary">End Demo</Button>
          )}
          <Tooltip title="Refresh"><IconButton onClick={fetchData} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: "Total Sales", value: `₹${Number(stats.totalSales).toLocaleString()}`, icon: <SalesIcon />, color: "#22C55E" },
          { title: "Products", value: stats.totalProducts, icon: <InventoryIcon />, color: "#4F46E5" },
          { title: "Purchase Batches", value: stats.totalPurchases, icon: <PurchaseIcon />, color: "#8B5CF6" },
          { title: "Expiring Soon", value: stats.expiringItems, icon: <WarningIcon />, color: "#F59E0B" },
        ].map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none", transition: "all 0.2s", "&:hover": { boxShadow: `0 8px 24px ${alpha(c.color, 0.12)}`, transform: "translateY(-2px)" } }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500, mb: 0.5 }}>{c.title}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.5rem", color: c.color }}>{c.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: alpha(c.color, 0.08) }}>{React.cloneElement(c.icon, { sx: { fontSize: "1.5rem", color: c.color } })}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Command Center (Intelligence sections) ── */}
      <CommandCenter demoStep={demoActive ? demoStep : -1} />

      {/* ── Charts ── */}
      <Grid container spacing={2.5} sx={{ mb: 3, mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Revenue Trend</Typography>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.06)} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}` }} />
                  <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Box sx={{ py: 5, textAlign: "center" }}><Typography color="text.secondary">No revenue data yet</Typography></Box>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: "none", height: "100%", borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Payment Methods</Typography>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <Box sx={{ py: 5, textAlign: "center" }}><Typography color="text.secondary">No data</Typography></Box>}
          </Paper>
        </Grid>
      </Grid>

      {/* ── KPIs ── */}
      {kpis && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>KPI Analytics</Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { title: "Inventory Turnover", value: kpis.inventoryTurnover, suffix: "x", color: "#4F46E5", icon: <SpeedIcon />, target: 3, desc: "Sales vs Inventory ratio" },
              { title: "Stockout Rate", value: kpis.stockoutRate, suffix: "%", color: "#EF4444", icon: <StockoutIcon />, target: 100, desc: "Products out of stock", inverse: true },
              { title: "Approval Rate", value: kpis.approvalRate, suffix: "%", color: "#22C55E", icon: <ApprovalIcon />, target: 100, desc: "Requisition approvals" },
              { title: "Avg Order Value", value: kpis.averageOrderValue, suffix: "₹", color: "#06B6D4", icon: <AOVIcon />, target: null, desc: "Mean bill amount" },
              { title: "Return Rate", value: kpis.purchaseReturnRate, suffix: "%", color: "#F59E0B", icon: <WarningIcon />, target: 100, desc: "Purchase returns ratio", inverse: true },
              { title: "Mfg Completion", value: kpis.manufacturingCompletionRate, suffix: "%", color: "#8B5CF6", icon: <SpeedIcon />, target: 100, desc: "Completed orders" },
              { title: "Collection Rate", value: kpis.collectionRate, suffix: "%", color: "#10B981", icon: <SalesIcon />, target: 100, desc: "Payment collected vs billed" },
              { title: "Sync Success", value: kpis.syncSuccessRate, suffix: "%", color: "#6366F1", icon: <RefreshIcon />, target: 100, desc: "Data sync reliability" },
            ].map((k, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none", position: "relative", overflow: "visible", "&:hover": { boxShadow: `0 8px 24px ${alpha(k.color, 0.15)}`, transform: "translateY(-2px)" }, transition: "all 0.2s ease", borderRadius: 3 }}>
                  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: k.color, borderRadius: "12px 12px 0 0" }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(k.color, 0.1), display: "inline-flex" }}>{React.cloneElement(k.icon, { sx: { fontSize: "1.25rem", color: k.color } })}</Box>
                      {k.target && (
                        <Chip
                          size="small"
                          label={k.inverse ? (k.value <= 10 ? "Good" : "High") : (k.value >= k.target * 0.7 ? "Good" : "Low")}
                          sx={{
                            fontSize: "0.65rem", height: 20, fontWeight: 600,
                            bgcolor: alpha(k.inverse ? (k.value <= 10 ? "#22C55E" : "#EF4444") : (k.value >= k.target * 0.7 ? "#22C55E" : "#F59E0B"), 0.1),
                            color: k.inverse ? (k.value <= 10 ? "#22C55E" : "#EF4444") : (k.value >= k.target * 0.7 ? "#22C55E" : "#F59E0B"),
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.5rem" }}>
                      {k.suffix === "₹" ? `₹${Number(k.value).toLocaleString()}` : k.value}{k.suffix && k.suffix !== "₹" ? k.suffix : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>{k.title}</Typography>
                    {k.target && (
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(k.inverse ? Math.max(0, 100 - k.value) : (k.value / k.target) * 100, 100)}
                        sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(k.color, 0.1), "& .MuiLinearProgress-bar": { bgcolor: k.color, borderRadius: 2 } }}
                      />
                    )}
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", mt: 0.5, display: "block" }}>{k.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ── Simulate Dialog ── */}
      <Dialog open={simOpen} onClose={() => { setSimOpen(false); setSimResult(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>🔮 What-If Manufacturing Simulation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Simulate production to check material availability without executing it.</Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField select fullWidth label="Finished Product" value={simProduct} onChange={e => setSimProduct(e.target.value)} size="small">
              {finishedProducts.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField label="Quantity" type="number" value={simQty} onChange={e => setSimQty(e.target.value)} size="small" sx={{ width: 120 }} />
            <Button variant="contained" onClick={handleSimulate} disabled={simLoading || !simProduct || !simQty}>Run</Button>
          </Box>
          {simLoading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}
          {simResult && (
            <Box>
              <Chip label={simResult.canProduce ? "✓ Feasible" : "✗ Insufficient"} color={simResult.canProduce ? "success" : "error"} sx={{ mb: 2, fontWeight: 600 }} />
              {simResult.materialsRequired?.map((m, i) => (
                <Box key={i} sx={{ p: 1.5, borderRadius: 2, mb: 1, display: "flex", justifyContent: "space-between", border: `1px solid ${m.sufficient ? alpha("#22C55E",0.2) : alpha("#EF4444",0.2)}`, bgcolor: m.sufficient ? alpha("#22C55E",0.03) : alpha("#EF4444",0.03) }}>
                  <Typography variant="body2" fontWeight={500}>{m.productName}</Typography>
                  <Typography variant="body2">Required: <b>{m.required}</b> | Available: <b>{m.available}</b></Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => { setSimOpen(false); setSimResult(null); }}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
