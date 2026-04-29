import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { purchasesAPI } from '../services/api';
import { format } from 'date-fns';

const ExpiryNotification = ({ onExpiringCountChange, onNotification }) => {
  const [open, setOpen] = useState(false);
  const [expiringItems, setExpiringItems] = useState([]);

  useEffect(() => {
    const checkExpiringItems = async () => {
      try {
        const response = await purchasesAPI.getExpiring();
        const items = response.data;

        if (items.length > 0) {
          setExpiringItems(items);
          setOpen(true);
          onExpiringCountChange(items.length);
          onNotification(
            `Warning: ${items.length} products are expiring within 30 days!`,
            'warning'
          );
        } else {
          onExpiringCountChange(0);
        }
      } catch (error) {
        console.error('Error checking expiring items:', error);
        onNotification('Error checking expiring products', 'error');
      }
    };

    // Check on component mount (app startup)
    checkExpiringItems();

    // Set up interval to check every hour
    const interval = setInterval(checkExpiringItems, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getChipColor = (days) => {
    if (days <= 7) return 'error';
    if (days <= 14) return 'warning';
    return 'info';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #e0e0e0'
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6">Products Expiring Soon</Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The following products will expire within the next 30 days. Please take necessary action.
        </Typography>

        <List>
          {expiringItems.map((item) => {
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            return (
              <ListItem
                key={item._id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {item.productName}
                      </Typography>
                      <Chip
                        label={`${daysLeft} days left`}
                        color={getChipColor(daysLeft)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Expiry Date: {format(new Date(item.expiryDate), 'dd/MM/yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remaining Quantity: {item.remainingQty}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        MRP: ₹{item.mrp}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Acknowledge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpiryNotification;
