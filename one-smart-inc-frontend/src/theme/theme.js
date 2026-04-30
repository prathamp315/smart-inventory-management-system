import { createTheme, alpha } from '@mui/material/styles';

// ═══════════════════════════════════════════════
//  ROYAL SLATE — "Silent Premium" Design System
// ═══════════════════════════════════════════════

const tokens = {
  light: {
    primary: { main: '#4F46E5', light: '#6366F1', dark: '#4338CA', contrastText: '#FFFFFF' },
    secondary: { main: '#C0C0C0', light: '#D4D4D8', dark: '#A1A1AA', contrastText: '#111317' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    info: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
    success: { main: '#22C55E', light: '#4ADE80', dark: '#16A34A' },
    background: { default: '#F8F9FB', paper: '#FFFFFF' },
    text: { primary: '#111317', secondary: '#6B7280' },
    divider: 'rgba(0,0,0,0.08)',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
  },
  dark: {
    primary: { main: '#C0C0C0', light: '#D4D4D8', dark: '#A1A1AA', contrastText: '#111317' },
    secondary: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#111317' },
    error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
    warning: { main: '#FBBF24', light: '#FDE68A', dark: '#F59E0B' },
    info: { main: '#60A5FA', light: '#93C5FD', dark: '#3B82F6' },
    success: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
    background: { default: '#111317', paper: '#1a1c20' },
    text: { primary: '#F1F5F9', secondary: '#94a3b8' },
    divider: 'rgba(30, 41, 59, 0.5)',
    surface: '#1a1c20',
    surfaceVariant: '#22252b',
  },
};

const getDesignTokens = (mode) => {
  const c = tokens[mode];
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: c.primary,
      secondary: c.secondary,
      error: c.error,
      warning: c.warning,
      info: c.info,
      success: c.success,
      background: c.background,
      text: c.text,
      divider: c.divider,
    },
    typography: {
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      h1: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2 },
      h2: { fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
      h3: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
      h4: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.35 },
      h5: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 },
      h6: { fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.5 },
      subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5 },
      body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.6 },
      caption: { fontSize: '0.6875rem', fontWeight: 500, lineHeight: 1.5, color: c.text.secondary },
      overline: { fontSize: '0.625rem', fontWeight: 700, lineHeight: 2, letterSpacing: '0.1em', textTransform: 'uppercase' },
      button: { fontWeight: 600, textTransform: 'none', fontSize: '0.8125rem', letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 4 },
    shadows: [
      'none',
      isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
      isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
      isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.07)',
      isDark ? '0 4px 16px rgba(0,0,0,0.6)' : '0 10px 15px rgba(0,0,0,0.1)',
      isDark ? '0 8px 24px rgba(0,0,0,0.7)' : '0 20px 25px rgba(0,0,0,0.1)',
      isDark ? '0 12px 32px rgba(0,0,0,0.8)' : '0 25px 50px rgba(0,0,0,0.15)',
      ...Array(18).fill(isDark ? '0 12px 32px rgba(0,0,0,0.8)' : '0 25px 50px rgba(0,0,0,0.15)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@import': "url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap')",
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#2a2d33 #111317' : '#CBD5E1 #F1F5F9',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*::-webkit-scrollbar': { width: 6 },
          '*::-webkit-scrollbar-track': { background: isDark ? '#111317' : '#F1F5F9' },
          '*::-webkit-scrollbar-thumb': { background: isDark ? '#2a2d33' : '#CBD5E1', borderRadius: 3 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 4,
            padding: '7px 18px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            letterSpacing: '0.01em',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { transform: 'translateY(-1px)' },
          },
          contained: {
            ...(isDark ? {
              backgroundColor: '#C0C0C0',
              color: '#111317',
              '&:hover': { backgroundColor: '#D4D4D8', transform: 'translateY(-1px)' },
            } : {}),
          },
          outlined: {
            borderWidth: 1,
            borderColor: isDark ? 'rgba(192,192,192,0.25)' : c.divider,
            '&:hover': { borderWidth: 1, backgroundColor: isDark ? 'rgba(192,192,192,0.06)' : 'rgba(79,70,229,0.04)' },
          },
          sizeSmall: { padding: '4px 12px', fontSize: '0.75rem' },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 4,
            border: `1px solid ${c.divider}`,
            backgroundColor: isDark ? '#1a1c20' : '#FFFFFF',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { borderColor: isDark ? 'rgba(192,192,192,0.15)' : 'rgba(0,0,0,0.15)' },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: '16px 20px', '&:last-child': { paddingBottom: 16 } },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundImage: 'none',
            backgroundColor: isDark ? '#1a1c20' : '#FFFFFF',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              transition: 'all 200ms ease',
              '& fieldset': { borderColor: isDark ? 'rgba(192,192,192,0.12)' : c.divider, borderWidth: 1 },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(192,192,192,0.3)' : c.primary.main },
              '&.Mui-focused fieldset': { borderWidth: 1, borderColor: isDark ? '#C0C0C0' : c.primary.main },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 4, fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.02em' },
          sizeSmall: { height: 22 },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { borderRadius: 4, border: `1px solid ${c.divider}` },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            borderBottom: `1px solid ${c.divider}`,
            fontSize: '0.8125rem',
            borderLeft: 'none',
            borderRight: 'none',
          },
          head: {
            fontWeight: 700,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: c.text.secondary,
            backgroundColor: isDark ? '#22252b' : '#F9FAFB',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 150ms ease',
            '&:hover': { backgroundColor: isDark ? 'rgba(192,192,192,0.03)' : 'rgba(79,70,229,0.03)' },
            '&:last-child td': { borderBottom: 0 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${c.divider}`,
            backdropFilter: 'blur(20px)',
            backgroundColor: isDark ? 'rgba(26,28,32,0.95)' : 'rgba(255,255,255,0.98)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: '1.0625rem', fontWeight: 700, padding: '20px 24px 12px' },
        },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: '8px 24px 16px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? 'rgba(17,19,23,0.85)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${c.divider}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${c.divider}`,
            backgroundColor: isDark ? '#111317' : '#FFFFFF',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            margin: '1px 0',
            padding: '8px 12px',
            transition: 'all 200ms ease',
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(192,192,192,0.08)' : 'rgba(79,70,229,0.08)',
              '&:hover': { backgroundColor: isDark ? 'rgba(192,192,192,0.12)' : 'rgba(79,70,229,0.12)' },
            },
            '&:hover': { backgroundColor: isDark ? 'rgba(192,192,192,0.05)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 4,
            fontSize: '0.6875rem',
            fontWeight: 600,
            backgroundColor: isDark ? '#2a2d33' : '#1E293B',
            border: isDark ? '1px solid rgba(192,192,192,0.1)' : 'none',
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 4 } },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? '#22252b' : '#E5E7EB',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 2, height: 3 },
          bar: { borderRadius: 2 },
        },
      },
      MuiBadge: {
        styleOverrides: { badge: { fontSize: '0.625rem', fontWeight: 700 } },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            fontWeight: 700,
            backgroundColor: isDark ? '#2a2d33' : '#E5E7EB',
            color: isDark ? '#C0C0C0' : '#374151',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            transition: 'all 200ms ease',
            '&:hover': { backgroundColor: isDark ? 'rgba(192,192,192,0.08)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: { borderRadius: 4 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${c.divider}`,
            backdropFilter: 'blur(20px)',
            backgroundColor: isDark ? 'rgba(26,28,32,0.95)' : 'rgba(255,255,255,0.98)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            margin: '2px 4px',
            fontSize: '0.8125rem',
            transition: 'all 150ms ease',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 4,
            border: `1px solid ${c.divider}`,
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: c.divider },
        },
      },
    },
  };
};

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

// Default dark theme for Royal Slate
const theme = createAppTheme('dark');
export default theme;
