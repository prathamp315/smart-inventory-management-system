import { createTheme } from '@mui/material/styles';

// Material 3 inspired color palette
const primaryColor = {
  main: '#006494',
  light: '#4B9FD8',
  dark: '#004266',
  contrastText: '#FFFFFF',
};

const secondaryColor = {
  main: '#8358A0',
  light: '#AB7BC3',
  dark: '#5D3B72',
  contrastText: '#FFFFFF',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: primaryColor,
    secondary: secondaryColor,
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    grey: {
      50: '#F8F9FA',
      100: '#ECEFF1',
      200: '#CFD8DC',
      300: '#B0BEC5',
      800: '#37474F',
      900: '#263238',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
    subtitle1: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '0.95rem' },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 6,
          padding: 0,
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '10px 20px',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 4px 8px rgba(0,0,0,0.12)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& input': { padding: '14px' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.12)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor.main },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: primaryColor.main },
          },
          '& .MuiInputLabel-root': {
            '&.MuiInputLabel-outlined': { transform: 'translate(14px, 14px) scale(1)' },
            '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { padding: '14px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 6,
          '&.MuiPaper-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          overflow: 'hidden',
          '& .MuiPaper-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '12px 16px' },
        head: { fontWeight: 600, backgroundColor: 'rgba(0, 0, 0, 0.02)' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          boxShadow: '0px 8px 24px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.25rem', fontWeight: 600, padding: '20px 24px 16px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '0 24px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '16px 24px 20px', gap: '8px' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          paddingLeft: '24px !important',
          paddingRight: '24px !important',
          minHeight: '64px',
        },
      },
    },
  },
});

export default theme;
