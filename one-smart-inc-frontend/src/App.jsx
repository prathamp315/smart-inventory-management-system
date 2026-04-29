import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Alert,
  Snackbar,
  IconButton,
  Badge,
  Avatar,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  Button,
  Chip,
  InputBase,
  Popover,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as PurchaseIcon,
  Receipt as BillingIcon,
  ReceiptLong as ReceiptIcon,
  AssignmentReturn as ReturnIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Assignment as AssignmentIcon,
  PrecisionManufacturing as ManufacturingIcon,
  AccountTree as BOMIcon,
  Logout as LogoutIcon,
  LocalShipping as SupplierIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Close as CloseIcon,
  HistoryEdu as AuditIcon,
  Timeline as TraceIcon,
  KeyboardArrowDown,
  NotificationsNone,
  Circle as CircleIcon,
  Lightbulb,
  Psychology,
} from '@mui/icons-material';

// Import components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Purchases from './components/Purchases';
import Billing from './components/Billing';
import Bills from './components/Bills';
import Returns from './components/Returns';
import ExpiryNotification from './components/ExpiryNotification';
import Requisitions from "./components/Requisitions";
import Manufacturing from "./components/Manufacturing";
import BOM from "./components/BOM";
import Supplier from "./components/Supplier";
import AuditLogs from "./components/AuditLogs";
import Traceability from "./components/Traceability";
import DecisionDashboard from "./components/DecisionDashboard";
import IntelligenceDashboard from "./components/IntelligenceDashboard";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";

import { useThemeMode } from './theme/ThemeContext';
import { useNotifications } from './context/NotificationContext';

const drawerWidth = 260;

// Menu items grouped by modules
const menuGroups = [
  {
    label: 'Overview',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Decision Support', icon: <Lightbulb />, path: '/decisions' },
      { text: 'Intelligence', icon: <Psychology />, path: '/intelligence' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { text: 'Products', icon: <InventoryIcon />, path: '/products' },
      { text: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
      { text: 'Purchases', icon: <PurchaseIcon />, path: '/purchases' },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { text: 'Requisitions', icon: <AssignmentIcon />, path: '/requisitions' },
    ],
  },
  {
    label: 'Production',
    items: [
      { text: 'Manufacturing', icon: <ManufacturingIcon />, path: '/manufacturing' },
      { text: 'BOM', icon: <BOMIcon />, path: '/bom' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { text: 'Billing', icon: <BillingIcon />, path: '/billing' },
      { text: 'Bills', icon: <ReceiptIcon />, path: '/bills' },
      { text: 'Returns', icon: <ReturnIcon />, path: '/returns' },
    ],
  },
  {
    label: 'System',
    items: [
      { text: 'Traceability', icon: <TraceIcon />, path: '/traceability' },
      { text: 'Audit Logs', icon: <AuditIcon />, path: '/audit-logs' },
    ],
  },
];

const roleMenus = {
  Admin: ['Dashboard', 'Decision Support', 'Intelligence', 'Products', 'Suppliers', 'Purchases', 'Requisitions', 'Manufacturing', 'BOM', 'Billing', 'Bills', 'Returns', 'Traceability', 'Audit Logs'],
  InventoryManager: ['Dashboard', 'Decision Support', 'Intelligence', 'Products', 'Suppliers', 'Purchases', 'Traceability'],
  ProcurementManager: ['Dashboard', 'Decision Support', 'Intelligence', 'Requisitions', 'Purchases', 'Suppliers'],
  ProductionManager: ['Dashboard', 'Decision Support', 'Intelligence', 'Manufacturing', 'BOM', 'Products', 'Traceability'],
  SalesExecutive: ['Dashboard', 'Decision Support', 'Intelligence', 'Billing', 'Bills', 'Returns'],
};

const roleLabels = {
  Admin: 'Administrator',
  InventoryManager: 'Inventory Manager',
  ProcurementManager: 'Procurement Manager',
  ProductionManager: 'Production Manager',
  SalesExecutive: 'Sales Executive',
};

function AppLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeMode();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [expiringCount, setExpiringCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole = user?.role || "Admin";
  const allowedMenuTexts = roleMenus[userRole] || roleMenus.Admin;

  // Filter menu groups based on role
  const filteredGroups = useMemo(() => {
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => allowedMenuTexts.includes(item.text)),
      }))
      .filter((group) => group.items.length > 0);
  }, [allowedMenuTexts]);

  // Get page title from current path
  const currentPageTitle = useMemo(() => {
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.path === location.pathname) return item.text;
      }
    }
    return 'Dashboard';
  }, [location.pathname]);

  // Online/Offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const userInitials = useMemo(() => {
    const name = user?.name || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [user]);

  const drawer = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: mode === 'dark'
        ? 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)'
        : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    }}>
      {/* Logo */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}>
        <Avatar
          sx={{
            width: 38,
            height: 38,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            fontSize: '1rem',
          }}
        >
          <StoreIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: '0.9375rem' }}>
            One Smart Inc
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
            ERP Dashboard
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* User Info */}
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
          {user?.name || "User"}
        </Typography>
        <Chip
          label={roleLabels[userRole] || userRole}
          size="small"
          sx={{
            mt: 0.5,
            height: 22,
            fontSize: '0.625rem',
            fontWeight: 600,
            background: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            border: 'none',
          }}
        />
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {filteredGroups.map((group, gIdx) => (
          <Box key={group.label} sx={{ mb: 1 }}>
            <Typography
              variant="overline"
              sx={{
                px: 1.5,
                py: 0.5,
                display: 'block',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.1em',
              }}
            >
              {group.label}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 2,
                        py: 0.875,
                        px: 1.5,
                        minHeight: 40,
                        ...(isActive ? {
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.9)})`,
                          color: '#fff',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          },
                        } : {
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.06),
                          },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{
                        color: isActive ? '#fff' : 'text.secondary',
                        minWidth: 36,
                        '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                      }}>
                        {item.text === 'Dashboard' && expiringCount > 0 ? (
                          <Badge badgeContent={expiringCount} color="error" overlap="circular">
                            {item.icon}
                          </Badge>
                        ) : item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1,
            fontSize: '0.8125rem',
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile/Tablet Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { md: 'none' }, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Page title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.125rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {currentPageTitle}
            </Typography>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Global Search */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                border: `1px solid ${theme.palette.divider}`,
                width: 240,
                transition: 'all 0.2s ease',
                '&:focus-within': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  width: 300,
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
              <InputBase
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ fontSize: '0.8125rem', flex: 1 }}
              />
            </Box>

            {/* Dark mode toggle */}
            <Tooltip title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.3s ease',
                  '&:hover': { color: 'primary.main', transform: 'rotate(30deg)' },
                }}
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notification Bell */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <Badge
                  badgeContent={unreadCount + expiringCount}
                  color="error"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.625rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <NotificationsNone />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Online/Offline */}
            <Chip
              icon={isOnline ? <WifiIcon sx={{ fontSize: '0.875rem !important' }} /> : <WifiOffIcon sx={{ fontSize: '0.875rem !important' }} />}
              label={isOnline ? 'Online' : 'Offline'}
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                height: 28,
                fontSize: '0.6875rem',
                fontWeight: 600,
                ...(isOnline ? {
                  bgcolor: alpha('#22C55E', 0.1),
                  color: '#16A34A',
                  border: `1px solid ${alpha('#22C55E', 0.3)}`,
                } : {
                  bgcolor: alpha('#EF4444', 0.1),
                  color: '#DC2626',
                  border: `1px solid ${alpha('#EF4444', 0.3)}`,
                }),
              }}
            />

            {/* User Avatar + Dropdown */}
            <Box
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                }}
              >
                {userInitials}
              </Avatar>
              <KeyboardArrowDown sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            </Box>

            {/* User Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 180,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" fontWeight={600}>{user?.name || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email || ''}</Typography>
              </Box>
              <MenuItem
                onClick={() => { handleLogout(); setUserMenuAnchor(null); }}
                sx={{ py: 1.5, color: 'error.main', fontWeight: 500 }}
              >
                <LogoutIcon sx={{ mr: 1.5, fontSize: '1.1rem' }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Notification Panel */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1,
              width: 360,
              maxHeight: 440,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              borderRadius: 3,
            },
          }}
        >
          <Box sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ fontSize: '0.75rem' }}>
                Mark all read
              </Button>
            )}
          </Box>
          <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
            {notifications.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <NotificationsNone sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
              </Box>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <Box
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: notif.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                    transition: 'background 0.15s ease',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                  }}
                >
                  <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{notif.icon}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 600, fontSize: '0.8125rem' }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  {!notif.read && (
                    <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mt: 0.75 }} />
                  )}
                </Box>
              ))
            )}
          </Box>
        </Popover>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <ExpiryNotification
            onExpiringCountChange={setExpiringCount}
            onNotification={showNotification}
          />

          <Routes>
            <Route path="/" element={<Dashboard onNotification={showNotification} />} />
            <Route path="/decisions" element={<DecisionDashboard />} />
            <Route path="/intelligence" element={<IntelligenceDashboard />} />
            <Route path="/products" element={<Products onNotification={showNotification} />} />
            <Route path="/suppliers" element={<Supplier onNotification={showNotification} />} />
            <Route path="/purchases" element={<Purchases onNotification={showNotification} />} />
            <Route path="/requisitions" element={<Requisitions onNotification={showNotification} />} />
            <Route path="/manufacturing" element={<Manufacturing onNotification={showNotification} />} />
            <Route path="/bom" element={<BOM onNotification={showNotification} />} />
            <Route path="/billing" element={<Billing onNotification={showNotification} />} />
            <Route path="/bills" element={<Bills onNotification={showNotification} />} />
            <Route path="/returns" element={<Returns onNotification={showNotification} />} />
            <Route path="/traceability" element={<Traceability onNotification={showNotification} />} />
            <Route path="/audit-logs" element={<AuditLogs onNotification={showNotification} />} />
          </Routes>
        </Box>
      </Box>

      {/* Global Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            fontWeight: 500,
            fontSize: '0.8125rem',
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
