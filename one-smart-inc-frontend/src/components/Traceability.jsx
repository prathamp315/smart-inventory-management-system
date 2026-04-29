import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Card, CardContent, alpha, useTheme,
  Skeleton, LinearProgress, Chip, Divider, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent,
} from '@mui/lab';
import {
  Timeline as TimelineIcon, LocalShipping, Factory, ShoppingCart,
  Inventory, Assignment, Receipt, CheckCircle, ArrowForward,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { productsAPI, traceabilityAPI } from '../services/api';
import { format } from 'date-fns';

// ─── Type config ───
const typeConfig = {
  Requisition: { color: '#3B82F6', icon: <Assignment />, label: 'Requisition' },
  Purchase:    { color: '#8B5CF6', icon: <Inventory />,  label: 'Purchase' },
  Manufacturing: { color: '#F59E0B', icon: <Factory />,  label: 'Manufacturing' },
  Sale:        { color: '#22C55E', icon: <Receipt />,    label: 'Sale' },
};

const flowSteps = [
  { key: 'requisition', label: 'Requisition', icon: <Assignment />, color: '#3B82F6' },
  { key: 'purchase', label: 'Purchase', icon: <Inventory />, color: '#8B5CF6' },
  { key: 'manufacturing', label: 'Manufacturing', icon: <Factory />, color: '#F59E0B' },
  { key: 'sale', label: 'Sale', icon: <Receipt />, color: '#22C55E' },
];

// ─── Flow View Component ───
const FlowView = ({ flow }) => {
  const theme = useTheme();
  return (
    <Paper sx={{
      p: 3, mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none',
      overflow: 'hidden', position: 'relative',
    }}>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #F59E0B, #22C55E)',
        borderRadius: '12px 12px 0 0',
      }} />
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2.5, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Product Lifecycle Flow
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        {flowSteps.map((step, i) => {
          const active = flow?.[step.key];
          return (
            <React.Fragment key={step.key}>
              <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                opacity: active ? 1 : 0.35,
                transition: 'all 0.3s ease',
                transform: active ? 'scale(1)' : 'scale(0.92)',
              }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  bgcolor: active ? alpha(step.color, 0.12) : alpha(theme.palette.text.primary, 0.04),
                  border: `2.5px solid ${active ? step.color : theme.palette.divider}`,
                  boxShadow: active ? `0 4px 16px ${alpha(step.color, 0.25)}` : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {active ? (
                    React.cloneElement(step.icon, { sx: { fontSize: '1.4rem', color: step.color } })
                  ) : (
                    React.cloneElement(step.icon, { sx: { fontSize: '1.4rem', color: 'text.disabled' } })
                  )}
                </Box>
                <Typography variant="caption" fontWeight={active ? 700 : 500} sx={{ color: active ? step.color : 'text.secondary', fontSize: '0.6875rem' }}>
                  {step.label}
                </Typography>
                {active && (
                  <CheckCircle sx={{ fontSize: '0.875rem', color: step.color, mt: -0.5 }} />
                )}
              </Box>
              {i < flowSteps.length - 1 && (
                <ArrowForward sx={{
                  fontSize: '1.1rem',
                  color: (flow?.[flowSteps[i].key] && flow?.[flowSteps[i + 1].key]) ? '#22C55E' : 'text.disabled',
                  opacity: (flow?.[flowSteps[i].key] && flow?.[flowSteps[i + 1].key]) ? 1 : 0.3,
                  mx: { xs: 0, sm: 0.5 },
                }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Paper>
  );
};

// ─── Timeline Event Card ───
const TimelineEventCard = ({ event }) => {
  const theme = useTheme();
  const cfg = typeConfig[event.type] || typeConfig.Purchase;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      p: 2, borderRadius: 3,
      border: `1px solid ${isDark ? alpha(cfg.color, 0.2) : alpha(cfg.color, 0.15)}`,
      bgcolor: isDark ? alpha(cfg.color, 0.04) : alpha(cfg.color, 0.03),
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateX(6px)',
        boxShadow: `0 6px 24px ${alpha(cfg.color, 0.12)}`,
        borderColor: alpha(cfg.color, 0.35),
      },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Chip
          label={cfg.label}
          size="small"
          sx={{
            height: 22, fontSize: '0.625rem', fontWeight: 700,
            bgcolor: alpha(cfg.color, 0.12), color: cfg.color,
          }}
        />
        {event.status && (
          <Chip
            label={event.status}
            size="small"
            variant="outlined"
            sx={{
              height: 20, fontSize: '0.6rem', fontWeight: 600,
              borderColor: alpha(cfg.color, 0.3), color: 'text.secondary',
            }}
          />
        )}
      </Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25, lineHeight: 1.3 }}>
        {event.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {event.description}
      </Typography>
    </Box>
  );
};

// ─── Main Component ───
const Traceability = ({ onNotification }) => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try { const r = await productsAPI.getAll(); setProducts(r.data); } catch (e) {}
    };
    fetchProducts();
  }, []);

  const fetchTraceability = async (productId) => {
    if (!productId) return;
    try {
      setLoading(true);
      const [traceRes, timelineRes] = await Promise.all([
        traceabilityAPI.getByProduct(productId),
        traceabilityAPI.getTimeline(productId),
      ]);
      setTraceData(traceRes.data);
      setTimelineData(timelineRes.data);
    } catch (e) {
      onNotification('Error loading traceability data', 'error');
      setTraceData(null);
      setTimelineData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
    fetchTraceability(e.target.value);
  };

  // Batch summary stats
  const stats = useMemo(() => {
    if (!traceData?.batches?.length) return null;
    const totalPurchased = traceData.batches.reduce((s, b) => s + b.purchasedQty, 0);
    const totalRemaining = traceData.batches.reduce((s, b) => s + b.remainingQty, 0);
    const totalSold = traceData.batches.reduce((s, b) => s + b.sold, 0);
    const totalMfg = traceData.batches.reduce((s, b) => s + b.usedInManufacturing, 0);
    return { totalPurchased, totalRemaining, totalSold, totalMfg };
  }, [traceData]);

  const StatBox = ({ icon, label, value, color }) => (
    <Card sx={{ flex: 1, minWidth: 130, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', transition: 'all 0.2s ease', '&:hover': { boxShadow: `0 6px 20px ${alpha(color, 0.12)}`, transform: 'translateY(-2px)' } }}>
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'inline-flex', mb: 1 }}>
          {React.cloneElement(icon, { sx: { color, fontSize: '1.25rem' } })}
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box className="animate-fadeIn">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TimelineIcon color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>End-to-End Traceability</Typography>
            <Typography variant="body2" color="text.secondary">Track the complete lifecycle of any product</Typography>
          </Box>
        </Box>
        <TextField select label="Select Product" value={selectedProduct} onChange={handleProductChange} size="small" sx={{ minWidth: 280 }}>
          <MenuItem value="" disabled>Select a product...</MenuItem>
          {products.map(p => <MenuItem key={p._id} value={p._id}>{p.name} ({p.itemType})</MenuItem>)}
        </TextField>
      </Box>

      {/* Empty State */}
      {!selectedProduct && (
        <Paper sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <TimelineIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Select a product to view its complete lifecycle</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Track requisitions → purchases → manufacturing → sales</Typography>
        </Paper>
      )}

      {/* Loading */}
      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      {/* ─── Content ─── */}
      {timelineData && !loading && (
        <>
          {/* Product Header */}
          <Card sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', position: 'relative', overflow: 'visible' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #F59E0B, #22C55E)', borderRadius: '12px 12px 0 0' }} />
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>{timelineData.product?.name}</Typography>
                <Chip label={timelineData.product?.itemType} size="small" color={timelineData.product?.itemType === 'Finished' ? 'success' : 'primary'} sx={{ fontWeight: 600, mt: 0.25 }} />
              </Box>
              <Box sx={{ flex: 1 }} />
              <Chip label={`${timelineData.totalEvents} events`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            </CardContent>
          </Card>

          {/* Flow View */}
          <FlowView flow={timelineData.flow} />

          {/* Stats (from batch data) */}
          {stats && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <StatBox icon={<LocalShipping />} label="Total Purchased" value={stats.totalPurchased} color="#8B5CF6" />
              <StatBox icon={<Inventory />} label="Remaining Stock" value={stats.totalRemaining} color="#22C55E" />
              <StatBox icon={<Factory />} label="Used in Mfg" value={stats.totalMfg} color="#F59E0B" />
              <StatBox icon={<ShoppingCart />} label="Total Sold" value={stats.totalSold} color="#3B82F6" />
            </Box>
          )}

          {/* ─── TIMELINE ─── */}
          <Paper sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon color="primary" sx={{ fontSize: '1.25rem' }} />
              <Typography variant="h6" fontWeight={700}>Product Timeline</Typography>
            </Box>

            {timelineData.events.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No traceability data available for this product</Typography>
              </Box>
            ) : (
              <Box sx={{ p: { xs: 1, sm: 2 } }}>
                <Timeline position="alternate" sx={{ p: 0, m: 0 }}>
                  {timelineData.events.map((event, i) => {
                    const cfg = typeConfig[event.type] || typeConfig.Purchase;
                    return (
                      <TimelineItem key={i}>
                        <TimelineOppositeContent sx={{ flex: 0.3, py: 2, px: 1 }}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {event.date ? format(new Date(event.date), 'dd MMM yyyy') : '—'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.625rem' }}>
                            {event.date ? format(new Date(event.date), 'hh:mm a') : ''}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot sx={{
                            bgcolor: cfg.color,
                            boxShadow: `0 0 0 4px ${alpha(cfg.color, 0.15)}`,
                            width: 36, height: 36,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {React.cloneElement(cfg.icon, { sx: { fontSize: '1rem', color: '#fff' } })}
                          </TimelineDot>
                          {i < timelineData.events.length - 1 && (
                            <TimelineConnector sx={{ bgcolor: alpha(cfg.color, 0.2), width: 2 }} />
                          )}
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: 1.5, px: 1.5 }}>
                          <TimelineEventCard event={event} />
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </Box>
            )}
          </Paper>

          {/* ─── Batch Table (preserved from original) ─── */}
          {traceData?.batches?.length > 0 && (
            <Paper sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight={700}>Purchase Batches</Typography>
              </Box>
              <TableContainer><Table size="small">
                <TableHead><TableRow>
                  <TableCell>Batch ID</TableCell><TableCell>Date</TableCell><TableCell>Supplier</TableCell><TableCell align="right">Purchased</TableCell><TableCell align="right">Remaining</TableCell><TableCell align="right">Mfg Used</TableCell><TableCell align="right">Sold</TableCell><TableCell align="right">Price</TableCell><TableCell>Expiry</TableCell><TableCell>Usage</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {traceData.batches.map(batch => {
                    const usedPercent = batch.purchasedQty > 0 ? ((batch.purchasedQty - batch.remainingQty) / batch.purchasedQty) * 100 : 0;
                    return (
                      <TableRow key={batch.batchId} hover>
                        <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{batch.batchId}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{format(new Date(batch.purchaseDate), 'dd MMM yyyy')}</Typography></TableCell>
                        <TableCell>{batch.supplier}</TableCell>
                        <TableCell align="right">{batch.purchasedQty}</TableCell>
                        <TableCell align="right"><Typography fontWeight={600} color={batch.remainingQty <= 5 ? 'error.main' : 'text.primary'}>{batch.remainingQty}</Typography></TableCell>
                        <TableCell align="right">{batch.usedInManufacturing}</TableCell>
                        <TableCell align="right">{batch.sold}</TableCell>
                        <TableCell align="right">₹{batch.purchasePrice}</TableCell>
                        <TableCell>{batch.expiryDate ? format(new Date(batch.expiryDate), 'dd/MM/yy') : '—'}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Tooltip title={`${usedPercent.toFixed(0)}% consumed`}>
                            <LinearProgress variant="determinate" value={usedPercent} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: usedPercent > 80 ? '#EF4444' : usedPercent > 50 ? '#F59E0B' : '#22C55E' } }} />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table></TableContainer>
            </Paper>
          )}

          {/* Sales History */}
          {traceData?.salesHistory?.length > 0 && (
            <Paper sx={{ mb: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight={700}>Sales History</Typography>
              </Box>
              <TableContainer><Table size="small">
                <TableHead><TableRow>
                  <TableCell>Bill No</TableCell><TableCell>Date</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price/Unit</TableCell><TableCell align="right">Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {traceData.salesHistory.map((sale, i) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{sale.billNo}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{format(new Date(sale.date), 'dd MMM yyyy')}</Typography></TableCell>
                      <TableCell align="right">{sale.quantity}</TableCell>
                      <TableCell align="right">₹{sale.pricePerUnit}</TableCell>
                      <TableCell align="right"><Typography fontWeight={600}>₹{sale.total?.toFixed(2)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></TableContainer>
            </Paper>
          )}

          {/* Manufacturing Orders */}
          {traceData?.manufacturingOrders?.length > 0 && (
            <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight={700}>Related Manufacturing Orders</Typography>
              </Box>
              <TableContainer><Table size="small">
                <TableHead><TableRow><TableCell>Order ID</TableCell><TableCell>Finished Product</TableCell><TableCell>Qty</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
                <TableBody>
                  {traceData.manufacturingOrders.map(o => (
                    <TableRow key={o.orderId} hover>
                      <TableCell><Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>{o.orderId?.toString().slice(-6).toUpperCase()}</Typography></TableCell>
                      <TableCell>{o.finishedProduct}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell><Chip label={o.status} size="small" color={o.status === 'Completed' ? 'success' : o.status === 'InProgress' ? 'warning' : 'default'} sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Typography variant="caption">{o.date ? format(new Date(o.date), 'dd MMM yyyy') : '—'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Traceability;
