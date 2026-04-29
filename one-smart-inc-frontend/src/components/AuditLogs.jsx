import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, alpha, useTheme } from '@mui/material';
import { Search as SearchIcon, HistoryEdu as AuditIcon } from '@mui/icons-material';

const mockAuditLogs = [
  { id: 1, user: 'Admin', action: 'Created Product', module: 'Products', time: new Date(Date.now() - 3600000).toISOString(), type: 'create' },
  { id: 2, user: 'InventoryManager', action: 'Updated Stock Level', module: 'Inventory', time: new Date(Date.now() - 7200000).toISOString(), type: 'update' },
  { id: 3, user: 'ProcurementManager', action: 'Approved Requisition #PR-001', module: 'Requisitions', time: new Date(Date.now() - 10800000).toISOString(), type: 'approve' },
  { id: 4, user: 'ProductionManager', action: 'Started Manufacturing Order', module: 'Manufacturing', time: new Date(Date.now() - 14400000).toISOString(), type: 'update' },
  { id: 5, user: 'SalesExecutive', action: 'Generated Bill INV-1001', module: 'Billing', time: new Date(Date.now() - 18000000).toISOString(), type: 'create' },
  { id: 6, user: 'Admin', action: 'Added Supplier', module: 'Suppliers', time: new Date(Date.now() - 21600000).toISOString(), type: 'create' },
  { id: 7, user: 'ProcurementManager', action: 'Rejected Requisition #PR-002', module: 'Requisitions', time: new Date(Date.now() - 25200000).toISOString(), type: 'reject' },
  { id: 8, user: 'ProductionManager', action: 'Completed Manufacturing Order', module: 'Manufacturing', time: new Date(Date.now() - 28800000).toISOString(), type: 'complete' },
];

const typeColors = { create: 'success', update: 'info', approve: 'success', reject: 'error', complete: 'secondary', delete: 'error' };

const AuditLogs = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => mockAuditLogs.filter(l =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.module.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  return (
    <Box className="animate-fadeIn">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AuditIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Audit Logs</Typography>
        </Box>
        <TextField placeholder="Search logs..." size="small" value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
      </Box>
      <Paper sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Module</TableCell><TableCell>Time</TableCell><TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{log.user}</Typography></TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell><Chip label={log.module} size="small" variant="outlined" /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(log.time).toLocaleString()}</Typography></TableCell>
                  <TableCell><Chip label={log.type} size="small" color={typeColors[log.type] || 'default'} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No audit logs found</Typography>
                  <Typography variant="caption" color="text.secondary">Activity will appear here as actions are performed</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AuditLogs;
