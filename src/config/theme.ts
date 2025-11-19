import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Color Palette
 */
const colors = {
  primary: '#2563EB', // Blue 600
  primaryDark: '#1E40AF', // Blue 700
  secondary: '#10B981', // Green 500
  accent: '#F59E0B', // Amber 500
  error: '#EF4444', // Red 500
  warning: '#F59E0B', // Amber 500
  success: '#10B981', // Green 500
  info: '#3B82F6', // Blue 500

  // Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Status colors
  statusActive: '#10B981',
  statusInactive: '#6B7280',
  statusPending: '#F59E0B',
  statusCancelled: '#EF4444',
};

/**
 * Light Theme
 */
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: colors.gray50,
    text: colors.gray900,
    textSecondary: colors.gray600,
    border: colors.gray200,
    card: '#FFFFFF',
    notification: colors.error,

    // Custom colors
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    disabled: colors.gray400,
    placeholder: colors.gray400,
    backdrop: 'rgba(0, 0, 0, 0.5)',

    // Status colors
    statusActive: colors.statusActive,
    statusInactive: colors.statusInactive,
    statusPending: colors.statusPending,
    statusCancelled: colors.statusCancelled,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

/**
 * Dark Theme
 */
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.gray900,
    surface: colors.gray800,
    surfaceVariant: colors.gray700,
    text: '#FFFFFF',
    textSecondary: colors.gray400,
    border: colors.gray700,
    card: colors.gray800,
    notification: colors.error,

    // Custom colors
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    disabled: colors.gray600,
    placeholder: colors.gray600,
    backdrop: 'rgba(0, 0, 0, 0.7)',

    // Status colors
    statusActive: colors.statusActive,
    statusInactive: colors.statusInactive,
    statusPending: colors.statusPending,
    statusCancelled: colors.statusCancelled,
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  fontSize: lightTheme.fontSize,
  fontWeight: lightTheme.fontWeight,
  shadows: lightTheme.shadows,
};

export type Theme = typeof lightTheme;
