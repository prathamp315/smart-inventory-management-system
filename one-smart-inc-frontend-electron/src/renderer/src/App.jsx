import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  CssBaseline,
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as PurchaseIcon,
  Receipt as BillingIcon,
  Receipt as ReceiptIcon,
  AssignmentReturn as ReturnIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';

// Import components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Purchases from './components/Purchases';
import Billing from './components/Billing';
import Bills from './components/Bills';
import Returns from './components/Returns';
import ExpiryNotification from './components/ExpiryNotification';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Products', icon: <InventoryIcon />, path: '/products' },
  { text: 'Purchases', icon: <PurchaseIcon />, path: '/purchases' },
  { text: 'Billing', icon: <BillingIcon />, path: '/billing' },
  { text: 'Bills', icon: <ReceiptIcon />, path: '/bills' },
  { text: 'Returns', icon: <ReturnIcon />, path: '/returns' },
];

function App() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [expiringCount, setExpiringCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40,
          }}
        >
          <StoreIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
            One Smart Inc
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inventory Management
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, mt: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 2, fontSize: '0.75rem', letterSpacing: '0.08rem' }}>
          Main Menu
        </Typography>
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                  minWidth: '46px',
                }}>
                  {item.text === 'Dashboard' && expiringCount > 0 ? (
                    <Badge badgeContent={expiringCount} color="error" overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0',
              boxShadow: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0',
              boxShadow: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#F8F9FA',
          minHeight: '100vh',
        }}
      >
        <AppBar
          position="static"
          color="default"
          sx={{
            boxShadow: 'none',
            backgroundColor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component="div"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Notifications">
                <IconButton size="large" color="inherit">
                  {expiringCount > 0 ? (
                    <Badge badgeContent={expiringCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  ) : (
                    <NotificationsIcon />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Your Profile">
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  <Avatar
                    alt="User"
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Chip
                icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
                label={isOnline ? 'Online' : 'Offline'}
                color={isOnline ? 'success' : 'error'}
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        <ExpiryNotification
          onExpiringCountChange={setExpiringCount}
          onNotification={showNotification}
        />

        <Routes>
          <Route path="/" element={<Dashboard onNotification={showNotification} />} />
          <Route path="/products" element={<Products onNotification={showNotification} />} />
          <Route path="/purchases" element={<Purchases onNotification={showNotification} />} />
          <Route path="/billing" element={<Billing onNotification={showNotification} />} />
          <Route path="/bills" element={<Bills onNotification={showNotification} />} />
          <Route path="/returns" element={<Returns onNotification={showNotification} />} />
        </Routes>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            },
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseNotification}
            >
              {/* Remove icon: dialogs should close with the button */}
            </IconButton>
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
