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
  BarChart as AOVIcon, Science as SimulateIcon,
  PlayCircle, SkipNext, Close, RestartAlt,
  PrecisionManufacturing as MfgIcon, AccountBalanceWallet as CollectIcon, Sync as SyncIcon,
} from "@mui/icons-material";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, Legend } from "recharts";
import { purchasesAPI, billsAPI, kpiAPI, demoAPI, productsAPI, insightsAPI } from "../services/api";
import { format } from "date-fns";
import CommandCenter from "./CommandCenter";

const COLORS = ["#4F46E5","#22C55E","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];

const DEMO_STEPS = [
  { id: 0, label: "Overview & KPIs", desc: "Key metrics and performance indicators at a glance.", section: "section-kpis" },
  { id: 1, label: "Revenue & Analytics", desc: "Revenue trends and payment breakdown charts.", section: "section-charts" },
  { id: 2, label: "Command Center", desc: "AI-powered recommendations, exceptions, and risk analysis.", section: "section-cc" },
];

export default function Dashboard({ onNotification }) {
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [stats, setStats] = useState({ totalSales: 0, totalProducts: 0, totalPurchases: 0, expiringItems: 0 });
  const [bills, setBills] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [simOpen, setSimOpen] = useState(false);
  const [simProduct, setSimProduct] = useState("");
  const [simQty, setSimQty] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
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

  // Scroll to section on demo step change
  useEffect(() => {
    if (demoStep >= 0 && DEMO_STEPS[demoStep]) {
      const el = document.getElementById(DEMO_STEPS[demoStep].section);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [demoStep]);

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

  const kpiItems = kpis ? [
    { title: "Inventory Turnover", value: kpis.inventoryTurnover, suffix: "x", color: "#4F46E5", icon: <SpeedIcon />, pct: Math.min((kpis.inventoryTurnover / 5) * 100, 100) },
    { title: "Stockout Rate", value: kpis.stockoutRate, suffix: "%", color: "#EF4444", icon: <StockoutIcon />, pct: Math.max(0, 100 - kpis.stockoutRate) },
    { title: "Approval Rate", value: kpis.approvalRate, suffix: "%", color: "#22C55E", icon: <ApprovalIcon />, pct: kpis.approvalRate },
    { title: "Avg Order Value", value: kpis.averageOrderValue, suffix: "₹", color: "#06B6D4", icon: <AOVIcon />, pct: null },
    { title: "Return Rate", value: kpis.purchaseReturnRate, suffix: "%", color: "#F59E0B", icon: <WarningIcon />, pct: Math.max(0, 100 - kpis.purchaseReturnRate) },
    { title: "Mfg Completion", value: kpis.manufacturingCompletionRate, suffix: "%", color: "#8B5CF6", icon: <MfgIcon />, pct: kpis.manufacturingCompletionRate },
    { title: "Collection Rate", value: kpis.collectionRate, suffix: "%", color: "#10B981", icon: <CollectIcon />, pct: kpis.collectionRate },
    { title: "Sync Success", value: kpis.syncSuccessRate, suffix: "%", color: "#6366F1", icon: <SyncIcon />, pct: kpis.syncSuccessRate },
  ] : [];

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={260} height={40} sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>{[1,2,3,4].map(i => <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>{[1,2,3,4,5,6,7,8].map(i => <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
    </Box>
  );

  return (
    <Box className="animate-fadeIn">
      {/* ═══════════════════════════════════════════ */}
      {/*  DEMO TOUR BANNER                          */}
      {/* ═══════════════════════════════════════════ */}
      {demoActive && (
        <Paper sx={{
          p: 2, mb: 3, borderRadius: 3,
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          color: "#fff", position: "sticky", top: 8, zIndex: 10,
          boxShadow: "0 8px 32px rgba(79,70,229,0.35)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <PlayCircle sx={{ fontSize: "1.5rem" }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                🎬 Demo — Step {demoStep + 1}/{DEMO_STEPS.length}: {DEMO_STEPS[demoStep]?.label}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{DEMO_STEPS[demoStep]?.desc}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {demoStep < DEMO_STEPS.length - 1 ? (
                <Button variant="contained" size="small" onClick={nextDemoStep} startIcon={<SkipNext />}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>Next</Button>
              ) : (
                <Button variant="contained" size="small" onClick={endDemo}
                  sx={{ bgcolor: "#22C55E", "&:hover": { bgcolor: "#16A34A" } }}>Finish ✓</Button>
              )}
              <IconButton size="small" onClick={endDemo} sx={{ color: "rgba(255,255,255,0.7)" }}><Close fontSize="small" /></IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, mt: 1.5 }}>
            {DEMO_STEPS.map((_, i) => (
              <Box key={i} sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: i <= demoStep ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "all 0.3s" }} />
            ))}
          </Box>
        </Paper>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/*  HEADER                                    */}
      {/* ═══════════════════════════════════════════ */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Welcome back, {user?.name?.split(" ")[0] || "User"} 👋</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{format(new Date(), "EEEE, MMMM d, yyyy")}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outlined" size="small" startIcon={<SimulateIcon />} onClick={() => setSimOpen(true)}
            sx={{ borderRadius: 1, textTransform: "none", fontWeight: 600 }}>Simulate</Button>
          <Tooltip title="Refresh"><IconButton onClick={fetchData} color="primary" size="small"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 1: SUMMARY STAT CARDS             */}
      {/* ═══════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 3 }} id="section-stats">
        {[
          { title: "Total Revenue", value: `₹${Number(stats.totalSales).toLocaleString()}`, icon: <SalesIcon />, color: "#22C55E", sub: `${bills.length} bills` },
          { title: "Products", value: stats.totalProducts, icon: <InventoryIcon />, color: "#4F46E5", sub: "Active catalog" },
          { title: "Purchase Batches", value: stats.totalPurchases, icon: <PurchaseIcon />, color: "#8B5CF6", sub: "Inventory inflow" },
          { title: "Expiring Soon", value: stats.expiringItems, icon: <WarningIcon />, color: stats.expiringItems > 0 ? "#EF4444" : "#22C55E", sub: stats.expiringItems > 0 ? "Needs attention" : "All clear" },
        ].map((c, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{
              border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3,
              transition: "all 0.2s", "&:hover": { boxShadow: `0 6px 20px ${alpha(c.color, 0.12)}`, transform: "translateY(-2px)" },
            }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.65rem" }}>{c.title}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: c.color, mt: 0.5 }}>{c.value}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>{c.sub}</Typography>
                  </Box>
                  <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: alpha(c.color, 0.08) }}>
                    {React.cloneElement(c.icon, { sx: { fontSize: "1.4rem", color: c.color } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 2: KPI ANALYTICS                  */}
      {/* ═══════════════════════════════════════════ */}
      {kpis && (
        <Paper id="section-kpis" sx={{
          mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3, overflow: "hidden",
          ...(demoActive && demoStep === 0 ? { border: "2px solid #4F46E5", boxShadow: `0 0 0 3px ${alpha("#4F46E5", 0.15)}` } : {}),
        }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", gap: 1 }}>
            <AnalyticsIcon sx={{ color: "#4F46E5", fontSize: "1.3rem" }} />
            <Typography variant="h6" fontWeight={700}>KPI Analytics</Typography>
            <Chip label="Live" size="small" sx={{ ml: "auto", height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: alpha("#22C55E", 0.1), color: "#22C55E" }} />
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {kpiItems.map((k, i) => (
                <Grid item xs={6} sm={4} md={3} lg={1.5} key={i}>
                  <Box sx={{
                    p: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`,
                    transition: "all 0.2s", "&:hover": { borderColor: alpha(k.color, 0.4), boxShadow: `0 4px 16px ${alpha(k.color, 0.1)}` },
                    position: "relative", overflow: "hidden",
                  }}>
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: k.color }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Box sx={{ p: 0.5, borderRadius: 1.5, bgcolor: alpha(k.color, 0.1), display: "flex" }}>
                        {React.cloneElement(k.icon, { sx: { fontSize: "1rem", color: k.color } })}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.2 }}>{k.title}</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, fontSize: "1.35rem" }}>
                      {k.suffix === "₹" ? `₹${Number(k.value).toLocaleString()}` : k.value}{k.suffix && k.suffix !== "₹" ? k.suffix : ""}
                    </Typography>
                    {k.pct !== null && (
                      <LinearProgress variant="determinate" value={Math.min(k.pct, 100)}
                        sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(k.color, 0.08), "& .MuiLinearProgress-bar": { bgcolor: k.color, borderRadius: 2 } }} />
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 3: CHARTS                         */}
      {/* ═══════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 3 }} id="section-charts">
        <Grid item xs={12} md={8}>
          <Paper sx={{
            p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 1,
            ...(demoActive && demoStep === 1 ? { border: "2px solid #4F46E5", boxShadow: `0 0 0 3px ${alpha("#4F46E5", 0.15)}` } : {}),
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Revenue Trend</Typography>
              <Chip label="Last 7 days" size="small" sx={{ height: 22, fontSize: "0.65rem", fontWeight: 600 }} />
            </Box>
            {revenueData.length > 0 ? (
              <Box sx={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barCategoryGap="25%" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.06)} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} width={50} />
                    <RTooltip contentStyle={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : <Box sx={{ py: 8, textAlign: "center" }}><Typography color="text.secondary">No revenue data available</Typography></Box>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 1,
            ...(demoActive && demoStep === 1 ? { border: "2px solid #4F46E5", boxShadow: `0 0 0 3px ${alpha("#4F46E5", 0.15)}` } : {}),
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Payment Breakdown</Typography>
            {paymentData.length > 0 ? (
              <Box sx={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius="70%" innerRadius="42%" paddingAngle={3}>
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 12 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : <Box sx={{ py: 8, textAlign: "center" }}><Typography color="text.secondary">No payment data</Typography></Box>}
          </Paper>
        </Grid>
      </Grid>

      {/* ═══════════════════════════════════════════ */}
      {/*  SECTION 4: COMMAND CENTER                 */}
      {/* ═══════════════════════════════════════════ */}
      <Box id="section-cc" sx={{
        ...(demoActive && demoStep === 2 ? { border: "2px solid #4F46E5", borderRadius: 3, p: 1, boxShadow: `0 0 0 3px ${alpha("#4F46E5", 0.15)}` } : {}),
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha("#8B5CF6", 0.1), display: "flex" }}>
            <AnalyticsIcon sx={{ fontSize: "1.2rem", color: "#8B5CF6" }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>Intelligent Command Center</Typography>
        </Box>
        <CommandCenter demoStep={-1} />
      </Box>

      {/* ═══════════════════════════════════════════ */}
      {/*  SIMULATE DIALOG                           */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={simOpen} onClose={() => { setSimOpen(false); setSimResult(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
