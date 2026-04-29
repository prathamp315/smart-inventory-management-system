import { createTheme } from '@mui/material/styles';

// Design system color tokens
const tokens = {
  light: {
    primary: { main: '#4F46E5', light: '#6366F1', dark: '#4338CA', contrastText: '#FFFFFF' },
    secondary: { main: '#22C55E', light: '#4ADE80', dark: '#16A34A', contrastText: '#FFFFFF' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    info: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
    success: { main: '#22C55E', light: '#4ADE80', dark: '#16A34A' },
    background: { default: '#F9FAFB', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
    divider: 'rgba(0,0,0,0.08)',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
  },
  dark: {
    primary: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#FFFFFF' },
    secondary: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E', contrastText: '#111827' },
    error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
    warning: { main: '#FBBF24', light: '#FDE68A', dark: '#F59E0B' },
    info: { main: '#60A5FA', light: '#93C5FD', dark: '#3B82F6' },
    success: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F1F5F9', secondary: '#94A3B8' },
    divider: 'rgba(255,255,255,0.08)',
    surface: '#1E293B',
    surfaceVariant: '#334155',
  },
};

const getDesignTokens = (mode) => {
  const colors = tokens[mode];
  return {
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      error: colors.error,
      warning: colors.warning,
      info: colors.info,
      success: colors.success,
      background: colors.background,
      text: colors.text,
      divider: colors.divider,
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
      h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 },
      h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.6 },
      caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5, color: colors.text.secondary },
      overline: { fontSize: '0.6875rem', fontWeight: 600, lineHeight: 2, letterSpacing: '0.08em', textTransform: 'uppercase' },
      button: { fontWeight: 500, textTransform: 'none', fontSize: '0.875rem' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0,0,0,0.05)',
      '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
      '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      '0 25px 50px -12px rgba(0,0,0,0.25)',
      ...Array(18).fill('0 25px 50px -12px rgba(0,0,0,0.25)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'dark' ? '#475569 #1E293B' : '#CBD5E1 #F1F5F9',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            fontWeight: 500,
            fontSize: '0.875rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
          },
          sizeSmall: {
            padding: '4px 12px',
            fontSize: '0.8125rem',
          },
          sizeLarge: {
            padding: '10px 24px',
            fontSize: '0.9375rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${colors.divider}`,
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '20px 24px',
            '&:last-child': { paddingBottom: '20px' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: colors.divider,
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderColor: colors.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
          sizeSmall: {
            height: 24,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            overflow: 'hidden',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '14px 16px',
            borderBottom: `1px solid ${colors.divider}`,
            fontSize: '0.8125rem',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.text.secondary,
            backgroundColor: mode === 'dark' ? colors.surfaceVariant : '#F9FAFB',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.04)',
            },
            '&:last-child td': { borderBottom: 0 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.25rem',
            fontWeight: 600,
            padding: '24px 24px 16px',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '8px 24px 16px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '16px 24px 24px', gap: '8px' },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 0',
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontSize: '0.6875rem',
            fontWeight: 600,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 600,
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

// Default light theme
const theme = createAppTheme('light');
export default theme;
