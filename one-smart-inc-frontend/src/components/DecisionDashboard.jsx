import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Chip, Card, CardContent, Grid, alpha, useTheme,
  LinearProgress, Skeleton, IconButton, Tooltip, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  Lightbulb, Warning, CheckCircle, Info, TrendingDown, TrendingUp,
  Factory, ErrorOutline, AttachMoney, Refresh, CompareArrows,
  NotificationsActive, PlayArrow, DoNotDisturb, ShoppingCart,
  Timer, Inventory, LocalOffer,
} from "@mui/icons-material";
import { insightsAPI, demoAPI } from "../services/api";

// ─── Section Wrapper ───
const Section = ({ icon, title, badge, children, color }) => {
  const t = useTheme();
  return (
    <Paper sx={{
      p: 0, mb: 3, border: `1px solid ${t.palette.divider}`, boxShadow: 'none',
      overflow: 'hidden', transition: 'box-shadow 0.3s ease',
      '&:hover': { boxShadow: `0 8px 32px ${alpha(color || t.palette.primary.main, 0.08)}` },
    }}>
      <Box sx={{
        px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5,
        borderBottom: `1px solid ${t.palette.divider}`,
        background: alpha(color || t.palette.primary.main, 0.03),
      }}>
        <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(color || t.palette.primary.main, 0.1), display: 'flex' }}>
          {React.cloneElement(icon, { sx: { fontSize: '1.25rem', color: color || t.palette.primary.main } })}
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{title}</Typography>
        {badge !== undefined && badge > 0 && (
          <Chip label={badge} size="small" sx={{ fontWeight: 700, bgcolor: alpha(color || '#EF4444', 0.1), color: color || '#EF4444' }} />
        )}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
};

export default function DecisionDashboard() {
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [demandSupply, setDemandSupply] = useState([]);
  const [productionPlan, setProductionPlan] = useState([]);
  const [exceptions, setExceptions] = useState(null);
  const [costing, setCosting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const a = alpha;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rec, ds, pp, ex, cost] = await Promise.all([
        insightsAPI.getRecommendations(),
        insightsAPI.getDemandSupplyV2(),
        insightsAPI.getProductionPlanV2(),
        insightsAPI.getExceptionsV2(),
        insightsAPI.getCostingAll(),
      ]);
      setRecommendations(rec.data || []);
      setDemandSupply(ds.data || []);
      setProductionPlan(pp.data || []);
      setExceptions(ex.data || null);
      setCosting(cost.data || []);
    } catch (e) { console.error("Decision fetch error:", e); }
    setLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try { await demoAPI.seed(); await fetchAll(); } catch (e) { console.error(e); }
    setSeeding(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Type config ───
  const typeConfig = {
    critical: { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: <Warning />, label: '⚠ Critical' },
    suggestion: { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: <Lightbulb />, label: '💡 Suggestion' },
    info: { color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle />, label: '✔ Info' },
  };
  const statusConfig = {
    Shortage: { color: '#EF4444', bg: '#FEF2F2' },
    'At Risk': { color: '#F59E0B', bg: '#FFFBEB' },
    Balanced: { color: '#22C55E', bg: '#F0FDF4' },
  };

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={280} height={36} sx={{ mb: 1 }} />
      <Grid container spacing={2}>{[1,2,3,4].map(i => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
    </Box>
  );

  const totalExceptions = exceptions?.totalExceptions || 0;

  return (
    <Box className="animate-fadeIn">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            🧠 Decision Support
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Actionable insights & recommendations powered by real-time data
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleSeed} disabled={seeding}
            startIcon={<PlayArrow />} sx={{ borderColor: '#22C55E', color: '#22C55E', '&:hover': { borderColor: '#16A34A', bgcolor: a('#22C55E', 0.04) } }}>
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Tooltip title="Refresh"><IconButton onClick={fetchAll} color="primary"><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* ━━━ 1. RECOMMENDED ACTIONS ━━━ */}
      <Section icon={<Lightbulb />} title="Recommended Actions" badge={recommendations.length} color="#F59E0B">
        {recommendations.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 40, color: '#22C55E', opacity: 0.5, mb: 1 }} />
            <Typography color="text.secondary">All clear — no actions needed right now</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recommendations.map((rec, i) => {
              const cfg = typeConfig[rec.type] || typeConfig.info;
              const isDark = theme.palette.mode === 'dark';
              return (
                <Box key={i} sx={{
                  p: 2, borderRadius: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start',
                  border: `1px solid ${isDark ? a(cfg.color, 0.25) : cfg.border}`,
                  bgcolor: isDark ? a(cfg.color, 0.06) : cfg.bg,
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'translateX(4px)', boxShadow: `0 4px 16px ${a(cfg.color, 0.12)}` },
                }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: a(cfg.color, 0.15), display: 'flex', flexShrink: 0 }}>
                    {React.cloneElement(cfg.icon, { sx: { fontSize: '1.25rem', color: cfg.color } })}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Chip label={cfg.label} size="small" sx={{ height: 20, fontSize: '0.625rem', fontWeight: 700, bgcolor: a(cfg.color, 0.12), color: cfg.color }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>{rec.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{rec.reason}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>{rec.icon}</Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Section>

      <Grid container spacing={2.5}>
        {/* ━━━ 2. DEMAND vs SUPPLY ━━━ */}
        <Grid item xs={12} md={7}>
          <Section icon={<CompareArrows />} title="Demand vs Supply" color="#4F46E5">
            {demandSupply.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No data available</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Demand/Day</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell align="center">Days Left</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {demandSupply.map((d, i) => {
                      const sc = statusConfig[d.status] || statusConfig.Balanced;
                      return (
                        <TableRow key={i} sx={{ '&:hover': { bgcolor: a(sc.color, 0.04) } }}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{d.product}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>{d.demandPerDay}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600} color={d.currentStock <= 15 ? 'error.main' : 'text.primary'}>{d.currentStock}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700} color={d.daysLeft <= 3 ? 'error.main' : d.daysLeft <= 7 ? 'warning.main' : 'success.main'}>
                              {d.daysLeft >= 999 ? '∞' : `${d.daysLeft}d`}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={d.status} size="small" sx={{ fontWeight: 600, fontSize: '0.6875rem', bgcolor: a(sc.color, 0.1), color: sc.color }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Section>
        </Grid>

        {/* ━━━ 4. EXCEPTIONS ━━━ */}
        <Grid item xs={12} md={5}>
          <Section icon={<ErrorOutline />} title="Exceptions" badge={totalExceptions} color="#EF4444">
            {totalExceptions === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#22C55E', opacity: 0.5, mb: 1 }} />
                <Typography color="text.secondary">No exceptions found</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {exceptions?.lowStock?.map((ls, i) => (
                  <Box key={`ls-${i}`} sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: a('#EF4444', 0.05), border: `1px solid ${a('#EF4444', 0.15)}` }}>
                    <Inventory sx={{ fontSize: '1.1rem', color: '#EF4444' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>⚠ {ls.product} — low stock</Typography>
                      <Typography variant="caption" color="text.secondary">Stock: {ls.stock} / Reorder: {ls.reorderLevel}</Typography>
                    </Box>
                  </Box>
                ))}
                {exceptions?.expiring?.map((ex, i) => (
                  <Box key={`ex-${i}`} sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: a('#F59E0B', 0.05), border: `1px solid ${a('#F59E0B', 0.15)}` }}>
                    <Timer sx={{ fontSize: '1.1rem', color: '#F59E0B' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>⚠ {ex.product} expiring in {ex.daysLeft} days</Typography>
                      <Typography variant="caption" color="text.secondary">Remaining: {ex.remainingQty} units</Typography>
                    </Box>
                  </Box>
                ))}
                {exceptions?.pendingRequisitions?.map((pr, i) => (
                  <Box key={`pr-${i}`} sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: a('#3B82F6', 0.05), border: `1px solid ${a('#3B82F6', 0.15)}` }}>
                    <ShoppingCart sx={{ fontSize: '1.1rem', color: '#3B82F6' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>⚠ Requisition pending — {pr.product} ({pr.quantity} units)</Typography>
                      <Typography variant="caption" color="text.secondary">By: {pr.requestedBy}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Section>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* ━━━ 3. PRODUCTION SUGGESTIONS ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<Factory />} title="Production Suggestions" color="#8B5CF6">
            {productionPlan.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No finished products to plan</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {productionPlan.map((p, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, transition: 'all 0.2s ease', '&:hover': { boxShadow: `0 4px 16px ${a('#8B5CF6', 0.1)}` } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{p.product}</Typography>
                        <Typography variant="caption" color="text.secondary">Stock: {p.currentStock} | Demand: {p.demandPerDay}/day</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" fontWeight={800} color={p.suggestedProduction > 0 ? '#8B5CF6' : 'success.main'}>
                          {p.suggestedProduction}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">units to produce</Typography>
                      </Box>
                    </Box>
                    {p.suggestedProduction > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={p.feasible ? '✓ Materials available' : '⚠ Materials shortage'}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: a(p.feasible ? '#22C55E' : '#F59E0B', 0.1), color: p.feasible ? '#22C55E' : '#F59E0B' }}
                        />
                        {p.materials?.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {p.materials.map((m, j) => (
                              <Chip key={j} size="small" variant="outlined"
                                label={`${m.material}: ${m.available}/${m.needed}`}
                                sx={{ fontSize: '0.625rem', height: 22, borderColor: m.sufficient ? a('#22C55E', 0.3) : a('#EF4444', 0.3), color: m.sufficient ? '#22C55E' : '#EF4444' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Section>
        </Grid>

        {/* ━━━ 5. COST ANALYSIS ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<AttachMoney />} title="Cost Analysis" color="#22C55E">
            {costing.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No BOM-defined products</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {costing.map((c, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, transition: 'all 0.2s ease', '&:hover': { boxShadow: `0 4px 16px ${a('#22C55E', 0.1)}` } }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{c.product}</Typography>
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      {[
                        { label: 'Cost/Unit', value: `₹${c.cost}`, color: '#4F46E5' },
                        { label: 'MRP', value: `₹${c.mrp}`, color: '#8B5CF6' },
                        { label: 'Profit', value: `₹${c.profit}`, color: c.profit >= 0 ? '#22C55E' : '#EF4444' },
                        { label: 'Margin', value: `${c.margin}%`, color: c.margin >= 20 ? '#22C55E' : '#F59E0B' },
                      ].map((m, j) => (
                        <Grid item xs={3} key={j}>
                          <Box sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: a(m.color, 0.06) }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: m.color, fontSize: '1rem' }}>{m.value}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{m.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {c.breakdown?.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {c.breakdown.map((b, j) => (
                          <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', px: 1, py: 0.5, borderRadius: 1, bgcolor: a(theme.palette.primary.main, 0.03) }}>
                            <Typography variant="caption">{b.material} × {b.qtyRequired}</Typography>
                            <Typography variant="caption" fontWeight={600}>₹{b.unitPrice} → ₹{b.cost}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
}
