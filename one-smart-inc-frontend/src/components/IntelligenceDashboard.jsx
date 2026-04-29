import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Chip, Grid, alpha, useTheme, Skeleton,
  IconButton, Tooltip, Button, LinearProgress, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  Psychology, AutoStories, NotificationsActive, Inventory,
  Preview, LocalFireDepartment, Refresh, CheckCircle,
  TrendingUp, Warning, Info, BugReport, ShoppingCart,
  Factory, PlayArrow,
} from "@mui/icons-material";
import { insightsAPI, productsAPI } from "../services/api";

// ─── Section Wrapper ───
const Section = ({ icon, title, badge, color, children }) => {
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

// ─── Severity config ───
const severityConfig = {
  High: { color: '#EF4444', bg: '#FEF2F2' },
  Medium: { color: '#F59E0B', bg: '#FFFBEB' },
  Low: { color: '#22C55E', bg: '#F0FDF4' },
};
const anomalyIcons = {
  "Sales Spike": <TrendingUp />, Overstock: <Inventory />,
  "No Sales": <Warning />, "Unnecessary Purchase": <ShoppingCart />,
};

export default function IntelligenceDashboard() {
  const theme = useTheme();
  const a = alpha;
  const [rootCause, setRootCause] = useState([]);
  const [story, setStory] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [aging, setAging] = useState([]);
  const [risk, setRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  // Impact preview
  const [impactOpen, setImpactOpen] = useState(false);
  const [impactProduct, setImpactProduct] = useState("");
  const [impactQty, setImpactQty] = useState(50);
  const [impactResult, setImpactResult] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rc, st, an, ag, rk, pr] = await Promise.all([
        insightsAPI.getRootCause(), insightsAPI.getStory(),
        insightsAPI.getAnomalies(), insightsAPI.getAging(),
        insightsAPI.getRisk(), productsAPI.getAll(),
      ]);
      setRootCause(rc.data || []);
      setStory(st.data?.summary || []);
      setAnomalies(an.data || []);
      setAging(ag.data || []);
      setRisk(rk.data || []);
      setProducts((pr.data || []).filter((p) => p.itemType === "Finished"));
    } catch (e) { console.error("Intelligence fetch error:", e); }
    setLoading(false);
  };

  const fetchImpact = async () => {
    if (!impactProduct || !impactQty) return;
    setImpactLoading(true);
    try {
      const r = await insightsAPI.getImpactPreview({ productId: impactProduct, quantity: Number(impactQty) });
      setImpactResult(r.data);
    } catch (e) { setImpactResult(null); }
    setImpactLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={280} height={36} sx={{ mb: 1 }} />
      <Grid container spacing={2}>{[1,2,3,4].map(i => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
    </Box>
  );

  // Aging bar helper
  const maxAging = Math.max(...aging.map((a2) => a2.total), 1);

  return (
    <Box className="animate-fadeIn">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            🧠 Intelligence & Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Root cause analysis, anomaly detection, risk scoring & predictive insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setImpactOpen(true)}
            startIcon={<Preview />} sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', '&:hover': { borderColor: '#7C3AED', bgcolor: a('#8B5CF6', 0.04) } }}>
            Impact Preview
          </Button>
          <Tooltip title="Refresh"><IconButton onClick={fetchAll} color="primary"><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* ━━━ SYSTEM STORY ━━━ */}
      <Section icon={<AutoStories />} title="System Summary (Last 7 Days)" color="#3B82F6">
        {story.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No activity recorded this week</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {story.map((s, i) => (
              <Box key={i} sx={{
                p: 1.5, borderRadius: 2, bgcolor: a('#3B82F6', 0.04),
                border: `1px solid ${a('#3B82F6', 0.1)}`,
                transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)', bgcolor: a('#3B82F6', 0.07) },
              }}>
                <Typography variant="body2" fontWeight={500}>{s}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Section>

      <Grid container spacing={2.5}>
        {/* ━━━ ROOT CAUSE ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<Psychology />} title="Root Cause Analysis" badge={rootCause.length} color="#EF4444">
            {rootCause.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#22C55E', opacity: 0.5, mb: 1 }} />
                <Typography color="text.secondary">No stock issues detected</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {rootCause.map((rc2, i) => (
                  <Box key={i} sx={{
                    p: 2, borderRadius: 2.5,
                    border: `1px solid ${a('#EF4444', 0.15)}`, bgcolor: a('#EF4444', 0.03),
                    transition: 'all 0.2s', '&:hover': { boxShadow: `0 4px 16px ${a('#EF4444', 0.1)}` },
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={rc2.issue} size="small" sx={{ fontWeight: 700, bgcolor: a('#EF4444', 0.12), color: '#EF4444', height: 22, fontSize: '0.625rem' }} />
                      <Typography variant="caption" color="text.secondary">Stock: {rc2.stock}</Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>{rc2.product}</Typography>
                    {rc2.causes.map((c, j) => (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.25 }}>
                        <BugReport sx={{ fontSize: '0.75rem', mt: 0.5, color: '#EF4444', opacity: 0.7 }} />
                        <Typography variant="caption" color="text.secondary">{c}</Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            )}
          </Section>
        </Grid>

        {/* ━━━ TOP RISK ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<LocalFireDepartment />} title="Top Risk Products" badge={risk.filter(r => r.level === 'High').length} color="#F59E0B">
            {risk.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#22C55E', opacity: 0.5, mb: 1 }} />
                <Typography color="text.secondary">No high-risk products</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {risk.slice(0, 8).map((r, i) => {
                  const sc = severityConfig[r.level] || severityConfig.Low;
                  return (
                    <Box key={i} sx={{
                      p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s', '&:hover': { boxShadow: `0 3px 12px ${a(sc.color, 0.1)}` },
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{r.product}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock: {r.stock} | Demand: {r.demandPerDay}/day
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: sc.color, lineHeight: 1 }}>{r.riskScore}</Typography>
                        <Chip label={r.level} size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 20, bgcolor: a(sc.color, 0.1), color: sc.color }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Section>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* ━━━ ANOMALIES ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<NotificationsActive />} title="Anomaly Detection" badge={anomalies.length} color="#8B5CF6">
            {anomalies.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#22C55E', opacity: 0.5, mb: 1 }} />
                <Typography color="text.secondary">No anomalies detected</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {anomalies.map((an2, i) => {
                  const icon = anomalyIcons[an2.type] || <Warning />;
                  const color = an2.severity === 'warning' ? '#F59E0B' : '#3B82F6';
                  return (
                    <Box key={i} sx={{
                      p: 1.5, borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      bgcolor: a(color, 0.04), border: `1px solid ${a(color, 0.12)}`,
                      transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)' },
                    }}>
                      <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: a(color, 0.12), display: 'flex', flexShrink: 0 }}>
                        {React.cloneElement(icon, { sx: { fontSize: '1rem', color } })}
                      </Box>
                      <Box>
                        <Chip label={an2.type} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: a(color, 0.1), color, mb: 0.5 }} />
                        <Typography variant="body2" fontWeight={500}>{an2.message}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Section>
        </Grid>

        {/* ━━━ INVENTORY AGING ━━━ */}
        <Grid item xs={12} md={6}>
          <Section icon={<Inventory />} title="Inventory Aging" color="#06B6D4">
            {aging.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No inventory data</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {aging.map((ag2, i) => (
                  <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{ag2.product}</Typography>
                      <Typography variant="caption" color="text.secondary">{ag2.total} units</Typography>
                    </Box>
                    {/* Stacked bar */}
                    <Box sx={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', bgcolor: a(theme.palette.text.primary, 0.04) }}>
                      {ag2.aging["0-7"] > 0 && (
                        <Tooltip title={`Fresh (0-7 days): ${ag2.aging["0-7"]}`}>
                          <Box sx={{ width: `${(ag2.aging["0-7"] / maxAging) * 100}%`, bgcolor: '#22C55E', transition: 'width 0.5s ease' }} />
                        </Tooltip>
                      )}
                      {ag2.aging["7-30"] > 0 && (
                        <Tooltip title={`Moderate (7-30 days): ${ag2.aging["7-30"]}`}>
                          <Box sx={{ width: `${(ag2.aging["7-30"] / maxAging) * 100}%`, bgcolor: '#F59E0B', transition: 'width 0.5s ease' }} />
                        </Tooltip>
                      )}
                      {ag2.aging["30+"] > 0 && (
                        <Tooltip title={`Old (30+ days): ${ag2.aging["30+"]}`}>
                          <Box sx={{ width: `${(ag2.aging["30+"] / maxAging) * 100}%`, bgcolor: '#EF4444', transition: 'width 0.5s ease' }} />
                        </Tooltip>
                      )}
                    </Box>
                    {/* Legend */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.75, flexWrap: 'wrap' }}>
                      {[{ label: '0-7d', val: ag2.aging["0-7"], color: '#22C55E' },
                        { label: '7-30d', val: ag2.aging["7-30"], color: '#F59E0B' },
                        { label: '30+d', val: ag2.aging["30+"], color: '#EF4444' }].map((l, j) => (
                        <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color }} />
                          <Typography variant="caption" color="text.secondary">{l.label}: {l.val}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Section>
        </Grid>
      </Grid>

      {/* ━━━ IMPACT PREVIEW DIALOG ━━━ */}
      <Dialog open={impactOpen} onClose={() => { setImpactOpen(false); setImpactResult(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Preview sx={{ color: '#8B5CF6' }} /> Action Impact Preview
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <TextField select label="Finished Product" value={impactProduct} onChange={(e) => setImpactProduct(e.target.value)} size="small" sx={{ flex: 2 }}>
              <MenuItem value="">Select...</MenuItem>
              {products.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField label="Quantity" type="number" value={impactQty} onChange={(e) => setImpactQty(e.target.value)} size="small" sx={{ flex: 1 }} />
            <Button variant="contained" onClick={fetchImpact} disabled={impactLoading || !impactProduct} sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}>
              {impactLoading ? '...' : 'Simulate'}
            </Button>
          </Box>

          {impactResult && (
            <Box>
              {/* Summary cards */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  { label: 'Total Cost', value: `₹${impactResult.totalCost}`, color: '#4F46E5' },
                  { label: 'Revenue', value: `₹${impactResult.revenue}`, color: '#3B82F6' },
                  { label: 'Profit', value: `₹${impactResult.profitEstimate}`, color: impactResult.profitEstimate >= 0 ? '#22C55E' : '#EF4444' },
                  { label: 'Margin', value: `${impactResult.margin}%`, color: '#8B5CF6' },
                ].map((c, i) => (
                  <Grid item xs={3} key={i}>
                    <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: a(c.color, 0.06) }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: c.color }}>{c.value}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{c.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Materials table */}
              <TableContainer><Table size="small">
                <TableHead><TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Required</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {impactResult.materials?.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{m.product}</Typography></TableCell>
                      <TableCell align="right">{m.required}</TableCell>
                      <TableCell align="right">{m.available}</TableCell>
                      <TableCell align="center">
                        <Chip label={m.status} size="small" sx={{
                          fontWeight: 600, fontSize: '0.625rem',
                          bgcolor: a(m.status === 'Sufficient' ? '#22C55E' : '#EF4444', 0.1),
                          color: m.status === 'Sufficient' ? '#22C55E' : '#EF4444',
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></TableContainer>

              {/* Warnings */}
              {impactResult.warnings?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {impactResult.warnings.map((w, i) => (
                    <Box key={i} sx={{ p: 1, borderRadius: 1.5, bgcolor: a('#EF4444', 0.06), border: `1px solid ${a('#EF4444', 0.12)}`, mb: 0.5 }}>
                      <Typography variant="caption" color="error.main" fontWeight={600}>⚠ {w}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImpactOpen(false); setImpactResult(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
