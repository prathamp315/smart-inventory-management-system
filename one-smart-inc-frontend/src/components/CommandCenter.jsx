import React, { useState, useEffect, useRef } from "react";
import {
  Box, Grid, Paper, Typography, Chip, alpha, useTheme, Button, IconButton,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Tooltip, Divider, Card, CardContent,
} from "@mui/material";
import {
  Lightbulb, Warning, TrendingUp, LocalFireDepartment, Inventory,
  Psychology, AutoStories, NotificationsActive, Refresh, ArrowForward,
  CheckCircle, Assignment, Factory, Receipt, Close, BarChart,
} from "@mui/icons-material";
import { insightsAPI, productsAPI, purchasesAPI, billsAPI, requisitionAPI } from "../services/api";
import { format } from "date-fns";

// ── helpers ──
const sev = { High: "#EF4444", Medium: "#F59E0B", Low: "#22C55E" };

function SectionCard({ id, title, icon, color, badge, children, demoActive }) {
  const t = useTheme();
  return (
    <Paper
      id={id}
      sx={{
        mb: 2.5, border: `1px solid ${demoActive ? color : t.palette.divider}`,
        boxShadow: demoActive ? `0 0 0 3px ${alpha(color, 0.25)}, 0 8px 32px ${alpha(color, 0.15)}` : "none",
        borderRadius: 3, overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${t.palette.divider}`, bgcolor: alpha(color, 0.03), display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(color, 0.1), display: "flex" }}>
          {React.cloneElement(icon, { sx: { fontSize: "1.2rem", color } })}
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{title}</Typography>
        {badge > 0 && <Chip label={badge} size="small" sx={{ fontWeight: 700, bgcolor: alpha(color, 0.12), color, height: 22, fontSize: "0.675rem" }} />}
        {demoActive && <Chip label="👈 Demo" size="small" sx={{ bgcolor: alpha(color, 0.15), color, fontWeight: 700, height: 22, fontSize: "0.675rem", animation: "pulse 1.5s infinite" }} />}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function DrillModal({ open, onClose, data }) {
  const t = useTheme();
  if (!data) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {data.icon && <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: alpha(data.color || "#4F46E5", 0.1) }}>{React.cloneElement(data.icon, { sx: { fontSize: "1.2rem", color: data.color || "#4F46E5" } })}</Box>}
          {data.title}
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {data.rows?.map((row, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderBottom: i < data.rows.length - 1 ? `1px solid ${t.palette.divider}` : "none" }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{row.label}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: row.color || "text.primary" }}>{row.value}</Typography>
          </Box>
        ))}
        {data.bullets?.map((b, i) => (
          <Box key={i} sx={{ p: 1.5, borderRadius: 2, mb: 1, bgcolor: alpha(b.color || "#4F46E5", 0.05), border: `1px solid ${alpha(b.color || "#4F46E5", 0.12)}` }}>
            <Typography variant="body2" fontWeight={500}>{b.text}</Typography>
          </Box>
        ))}
        {data.action && (
          <Box sx={{ mt: 2, p: 1.75, borderRadius: 2, bgcolor: alpha("#22C55E", 0.06), border: `1px solid ${alpha("#22C55E", 0.15)}` }}>
            <Typography variant="body2" fontWeight={600} color="success.main">💡 Suggested Action: {data.action}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

function ClickableRow({ children, onClick, color = "#4F46E5" }) {
  const t = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5, borderRadius: 2, mb: 1, cursor: "pointer",
        border: `1px solid ${t.palette.divider}`,
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        "&:hover": { transform: "translateX(4px)", boxShadow: `0 4px 16px ${alpha(color, 0.12)}`, borderColor: alpha(color, 0.3), bgcolor: alpha(color, 0.03) },
        display: "flex", alignItems: "center", gap: 1,
      }}
    >
      {children}
      <ArrowForward sx={{ fontSize: "0.875rem", color: "text.disabled", ml: "auto", flexShrink: 0 }} />
    </Box>
  );
}

export default function CommandCenter({ demoStep = -1 }) {
  const t = useTheme();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [exceptions, setExceptions] = useState(null);
  const [demandSupply, setDemandSupply] = useState([]);
  const [risk, setRisk] = useState([]);
  const [aging, setAging] = useState([]);
  const [rootCause, setRootCause] = useState([]);
  const [story, setStory] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [modal, setModal] = useState({ open: false, data: null });
  const [bills, setBills] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rec, exc, ds, rk, ag, rc, st, an, bl, pu] = await Promise.all([
        insightsAPI.getRecommendations().catch(() => ({ data: [] })),
        insightsAPI.getExceptions().catch(() => ({ data: null })),
        insightsAPI.getDemandSupply().catch(() => ({ data: [] })),
        insightsAPI.getRisk().catch(() => ({ data: [] })),
        insightsAPI.getAging().catch(() => ({ data: [] })),
        insightsAPI.getRootCause().catch(() => ({ data: [] })),
        insightsAPI.getStory().catch(() => ({ data: { summary: [] } })),
        insightsAPI.getAnomalies().catch(() => ({ data: [] })),
        billsAPI.getAll().catch(() => ({ data: [] })),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setRecommendations(rec.data || []);
      setExceptions(exc.data);
      setDemandSupply(ds.data || []);
      setRisk(rk.data || []);
      setAging(ag.data || []);
      setRootCause(rc.data || []);
      setStory(st.data?.summary || []);
      setAnomalies(an.data || []);
      setBills(bl.data || []);
      setPurchases(pu.data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Scroll highlighted section into view during demo
  useEffect(() => {
    const ids = ["cc-recommendations", "cc-demand-supply", "cc-risk", "cc-aging", "cc-root-cause"];
    if (demoStep >= 0 && demoStep < ids.length) {
      const el = document.getElementById(ids[demoStep]);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [demoStep]);

  const openModal = (data) => setModal({ open: true, data });
  const closeModal = () => setModal({ open: false, data: null });

  // Drill-down builders
  const recDrill = (rec) => openModal({
    title: rec.action, icon: <Lightbulb />, color: "#F59E0B",
    rows: [
      { label: "Product", value: rec.product || "—" },
      { label: "Priority", value: rec.priority || "High", color: "#EF4444" },
      { label: "Reason", value: rec.reason || rec.detail || "—" },
    ],
    action: rec.action,
  });

  const lowStockDrill = (ls) => {
    const productBills = bills.filter(b => b.items?.some(i => (i.product?._id || i.product)?.toString() === ls.productId?.toString()));
    const soldRecent = productBills.slice(-5).reduce((s, b) => s + (b.items?.find(i => (i.product?._id || i.product)?.toString() === ls.productId?.toString())?.quantity || 0), 0);
    openModal({
      title: `${ls.productName} — Low Stock`, icon: <Warning />, color: "#EF4444",
      rows: [
        { label: "Current Stock", value: ls.totalStock, color: "#EF4444" },
        { label: "Reorder Level", value: ls.reorderLevel },
        { label: "Daily Consumption", value: `${ls.dailyConsumption || "—"}/day` },
        { label: "Recent Sales (5 bills)", value: `${soldRecent} units` },
      ],
      action: "Raise a purchase requisition immediately",
    });
  };

  const riskDrill = (r) => openModal({
    title: `${r.product} — Risk Analysis`, icon: <LocalFireDepartment />, color: sev[r.level] || "#F59E0B",
    rows: [
      { label: "Risk Score", value: `${r.riskScore}/100`, color: sev[r.level] },
      { label: "Risk Level", value: r.level, color: sev[r.level] },
      { label: "Current Stock", value: r.stock },
      { label: "Demand/Day", value: r.demandPerDay },
      { label: "Reorder Level", value: r.reorderLevel },
    ],
    action: r.level === "High" ? "Reorder immediately" : r.level === "Medium" ? "Schedule reorder this week" : "Monitor regularly",
  });

  const anomalyDrill = (an) => openModal({
    title: `${an.type} — ${an.product}`, icon: <NotificationsActive />, color: "#8B5CF6",
    rows: [{ label: "Type", value: an.type }, { label: "Severity", value: an.severity }, { label: "Detail", value: an.message }],
    bullets: [{ text: an.message, color: "#8B5CF6" }],
    action: an.type === "Sales Spike" ? "Review inventory to meet demand" : an.type === "Overstock" ? "Pause new purchases" : "Investigate sales channel",
  });

  const rcDrill = (rc) => openModal({
    title: `${rc.product} — Root Cause`, icon: <Psychology />, color: "#EF4444",
    rows: [{ label: "Issue", value: rc.issue, color: "#EF4444" }, { label: "Stock", value: rc.stock }, { label: "Reorder Level", value: rc.reorderLevel }],
    bullets: rc.causes.map(c => ({ text: c, color: "#EF4444" })),
    action: "Address all listed causes to resolve the shortage",
  });

  const maxAging = Math.max(...aging.map(a => a.total), 1);

  if (loading) return (
    <Box>{[1,2,3,4].map(i => <Skeleton key={i} variant="rounded" height={140} sx={{ mb: 2, borderRadius: 3 }} />)}</Box>
  );

  return (
    <Box>
      <DrillModal open={modal.open} onClose={closeModal} data={modal.data} />

      {/* ── SECTION 1: RECOMMENDED ACTIONS ── */}
      <SectionCard id="cc-recommendations" title="💡 Recommended Actions" icon={<Lightbulb />} color="#F59E0B" badge={recommendations.length} demoActive={demoStep === 0}>
        {recommendations.length === 0 ? (
          <Box sx={{ py: 2, textAlign: "center" }}><CheckCircle sx={{ color: "#22C55E", opacity: 0.5 }} /><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>All good — no urgent actions needed</Typography></Box>
        ) : (
          recommendations.slice(0, 5).map((rec, i) => (
            <ClickableRow key={i} onClick={() => recDrill(rec)} color="#F59E0B">
              <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: alpha(rec.priority === "High" ? "#EF4444" : rec.priority === "Medium" ? "#F59E0B" : "#22C55E", 0.1) }}>
                <Lightbulb sx={{ fontSize: "1rem", color: rec.priority === "High" ? "#EF4444" : rec.priority === "Medium" ? "#F59E0B" : "#22C55E" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{rec.action}</Typography>
                <Typography variant="caption" color="text.secondary">{rec.reason || rec.detail}</Typography>
              </Box>
              <Chip label={rec.priority || "High"} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: alpha(rec.priority === "High" ? "#EF4444" : "#F59E0B", 0.1), color: rec.priority === "High" ? "#EF4444" : "#F59E0B" }} />
            </ClickableRow>
          ))
        )}
      </SectionCard>

      {/* ── SECTION 2: EXCEPTIONS ── */}
      <SectionCard id="cc-exceptions" title="⚠️ Exceptions" icon={<Warning />} color="#EF4444"
        badge={(exceptions?.summary?.totalExceptions || 0)} demoActive={demoStep === 1}>
        {!exceptions || exceptions?.summary?.totalExceptions === 0 ? (
          <Box sx={{ py: 2, textAlign: "center" }}><CheckCircle sx={{ color: "#22C55E", opacity: 0.5 }} /><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>No exceptions detected</Typography></Box>
        ) : (
          <>
            {exceptions.lowStock?.slice(0, 3).map((ls, i) => (
              <ClickableRow key={`ls${i}`} onClick={() => lowStockDrill(ls)} color="#EF4444">
                <Inventory sx={{ fontSize: "1.1rem", color: "#EF4444" }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>⚠ {ls.productName} — Low Stock</Typography>
                  <Typography variant="caption" color="text.secondary">Stock: {ls.totalStock} | Reorder: {ls.reorderLevel}</Typography>
                </Box>
              </ClickableRow>
            ))}
            {exceptions.expiring?.slice(0, 2).map((ex, i) => (
              <ClickableRow key={`ex${i}`} onClick={() => openModal({ title: `${ex.productName} — Expiring`, icon: <Warning />, color: "#F59E0B", rows: [{ label: "Days Left", value: ex.daysLeft, color: "#F59E0B" }, { label: "Remaining Qty", value: ex.remainingQty }], action: "Prioritize sales or return to supplier" })} color="#F59E0B">
                <Warning sx={{ fontSize: "1.1rem", color: "#F59E0B" }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>⏰ {ex.productName} — Expiring in {ex.daysLeft} days</Typography>
                  <Typography variant="caption" color="text.secondary">Qty remaining: {ex.remainingQty}</Typography>
                </Box>
              </ClickableRow>
            ))}
            {exceptions.pendingRequisitions?.slice(0, 2).map((r, i) => (
              <ClickableRow key={`req${i}`} onClick={() => openModal({ title: `${r.requisitionNumber} — Pending`, icon: <Assignment />, color: "#3B82F6", rows: [{ label: "Requisition No", value: r.requisitionNumber }, { label: "Quantity", value: r.quantity }, { label: "Status", value: r.status }, { label: "Requested By", value: r.requestedBy || "—" }], action: "Approve or reject this requisition" })} color="#3B82F6">
                <Assignment sx={{ fontSize: "1.1rem", color: "#3B82F6" }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>📋 {r.requisitionNumber} — Pending Approval</Typography>
                  <Typography variant="caption" color="text.secondary">Qty: {r.quantity}</Typography>
                </Box>
              </ClickableRow>
            ))}
          </>
        )}
      </SectionCard>

      {/* ── SECTION 3: ANALYTICS ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Demand vs Supply */}
        <Grid item xs={12} md={5}>
          <SectionCard id="cc-demand-supply" title="📊 Demand vs Supply" icon={<BarChart />} color="#4F46E5" badge={demandSupply.filter(d => d.status === "Shortage").length} demoActive={demoStep === 2}>
            {demandSupply.slice(0, 5).map((d, i) => {
              const c = d.status === "Shortage" ? "#EF4444" : d.status === "At Risk" ? "#F59E0B" : "#22C55E";
              return (
                <Box key={i} sx={{ mb: 1.25 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600}>{d.product}</Typography>
                    <Chip label={d.status} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: alpha(c, 0.1), color: c }} />
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(100, d.stock > 0 && d.demand > 0 ? (d.stock / Math.max(d.demand, 1)) * 100 : d.stock > 0 ? 100 : 0)} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(c, 0.1), "& .MuiLinearProgress-bar": { bgcolor: c, borderRadius: 3 } }} />
                  <Typography variant="caption" color="text.secondary">Stock: {d.stock} | Demand/day: {d.demandPerDay}</Typography>
                </Box>
              );
            })}
          </SectionCard>
        </Grid>

        {/* Top Risk Products */}
        <Grid item xs={12} md={3.5}>
          <SectionCard id="cc-risk" title="🔥 Top Risks" icon={<LocalFireDepartment />} color="#EF4444" badge={risk.filter(r => r.level === "High").length} demoActive={demoStep === 2}>
            {risk.slice(0, 5).map((r, i) => (
              <ClickableRow key={i} onClick={() => riskDrill(r)} color={sev[r.level]}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{r.product}</Typography>
                  <Typography variant="caption" color="text.secondary">Score: {r.riskScore}</Typography>
                </Box>
                <Chip label={r.level} size="small" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 700, bgcolor: alpha(sev[r.level], 0.1), color: sev[r.level] }} />
              </ClickableRow>
            ))}
          </SectionCard>
        </Grid>

        {/* Inventory Aging */}
        <Grid item xs={12} md={3.5}>
          <SectionCard id="cc-aging" title="📦 Aging" icon={<Inventory />} color="#06B6D4" demoActive={demoStep === 3}>
            {aging.slice(0, 5).map((a, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={600}>{a.product}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.total} units</Typography>
                </Box>
                <Tooltip title={`Fresh: ${a.aging["0-7"]} | Moderate: ${a.aging["7-30"]} | Old: ${a.aging["30+"]}`}>
                  <Box sx={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", bgcolor: alpha(t.palette.text.primary, 0.05) }}>
                    {a.aging["0-7"] > 0 && <Box sx={{ width: `${(a.aging["0-7"] / maxAging) * 100}%`, bgcolor: "#22C55E" }} />}
                    {a.aging["7-30"] > 0 && <Box sx={{ width: `${(a.aging["7-30"] / maxAging) * 100}%`, bgcolor: "#F59E0B" }} />}
                    {a.aging["30+"] > 0 && <Box sx={{ width: `${(a.aging["30+"] / maxAging) * 100}%`, bgcolor: "#EF4444" }} />}
                  </Box>
                </Tooltip>
              </Box>
            ))}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ── SECTION 4: INSIGHTS ── */}
      <Grid container spacing={2}>
        {/* Root Cause */}
        <Grid item xs={12} md={4}>
          <SectionCard id="cc-root-cause" title="🧠 Root Cause" icon={<Psychology />} color="#EF4444" badge={rootCause.length} demoActive={demoStep === 4}>
            {rootCause.length === 0 ? (
              <Box sx={{ py: 2, textAlign: "center" }}><CheckCircle sx={{ color: "#22C55E", opacity: 0.5 }} /><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>No issues found</Typography></Box>
            ) : rootCause.slice(0, 3).map((rc, i) => (
              <ClickableRow key={i} onClick={() => rcDrill(rc)} color="#EF4444">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{rc.product}</Typography>
                  <Typography variant="caption" color="text.secondary">{rc.causes[0]}</Typography>
                </Box>
              </ClickableRow>
            ))}
          </SectionCard>
        </Grid>

        {/* System Story */}
        <Grid item xs={12} md={4}>
          <SectionCard id="cc-story" title="📖 System Summary" icon={<AutoStories />} color="#3B82F6" demoActive={demoStep === 4}>
            {story.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No weekly activity data</Typography>
            ) : story.slice(0, 4).map((s, i) => (
              <Box key={i} sx={{ p: 1.25, borderRadius: 2, mb: 0.75, bgcolor: alpha("#3B82F6", 0.04), border: `1px solid ${alpha("#3B82F6", 0.08)}`, transition: "all 0.2s", "&:hover": { bgcolor: alpha("#3B82F6", 0.08) } }}>
                <Typography variant="body2" fontWeight={500}>{s}</Typography>
              </Box>
            ))}
          </SectionCard>
        </Grid>

        {/* Anomalies */}
        <Grid item xs={12} md={4}>
          <SectionCard id="cc-anomalies" title="🚨 Anomalies" icon={<NotificationsActive />} color="#8B5CF6" badge={anomalies.length} demoActive={demoStep === 4}>
            {anomalies.length === 0 ? (
              <Box sx={{ py: 2, textAlign: "center" }}><CheckCircle sx={{ color: "#22C55E", opacity: 0.5 }} /><Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>No anomalies</Typography></Box>
            ) : anomalies.slice(0, 4).map((an, i) => (
              <ClickableRow key={i} onClick={() => anomalyDrill(an)} color="#8B5CF6">
                <Box sx={{ flex: 1 }}>
                  <Chip label={an.type} size="small" sx={{ height: 18, fontSize: "0.575rem", fontWeight: 700, bgcolor: alpha("#8B5CF6", 0.1), color: "#8B5CF6", mb: 0.25 }} />
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.8rem" }}>{an.product}</Typography>
                </Box>
              </ClickableRow>
            ))}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
