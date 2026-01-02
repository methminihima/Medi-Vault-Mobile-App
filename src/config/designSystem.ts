import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Responsive Design System
 * Provides consistent spacing, typography, and layout utilities across all screen sizes
 */

// Device breakpoints
export const breakpoints = {
  xs: 320,    // Small phones
  sm: 375,    // Standard phones
  md: 768,    // Tablets
  lg: 1024,   // Large tablets / small desktops
  xl: 1280,   // Desktops
};

// Device type detection
export const deviceType = {
  isSmallPhone: width < breakpoints.sm,
  isPhone: width < breakpoints.md,
  isTablet: width >= breakpoints.md && width < breakpoints.lg,
  isLargeTablet: width >= breakpoints.lg && width < breakpoints.xl,
  isDesktop: width >= breakpoints.xl,
  isPortrait: height > width,
  isLandscape: width > height,
};

// Responsive functions
export const responsive = {
  // Get value based on device type
  getValue: (phone: number, tablet: number, desktop?: number) => {
    if (deviceType.isDesktop && desktop !== undefined) return desktop;
    if (deviceType.isTablet || deviceType.isLargeTablet) return tablet;
    return phone;
  },
  
  // Scale based on device width
  scale: (size: number) => {
    const scale = width / 375; // Base on iPhone X width
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  },
  
  // Vertical scale based on device height
  verticalScale: (size: number) => {
    const scale = height / 812; // Base on iPhone X height
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
  },
  
  // Moderate scale - less aggressive scaling
  moderateScale: (size: number, factor = 0.5) => {
    const scale = width / 375;
    return Math.round(size + (scale - 1) * size * factor);
  },
};

// Enhanced spacing system - responsive
export const spacing = {
  xs: responsive.moderateScale(4),
  sm: responsive.moderateScale(8),
  md: responsive.moderateScale(16),
  lg: responsive.moderateScale(24),
  xl: responsive.moderateScale(32),
  xxl: responsive.moderateScale(48),
  xxxl: responsive.moderateScale(64),
  
  // Container padding
  containerPadding: responsive.getValue(16, 24, 32),
  cardPadding: responsive.getValue(12, 16, 20),
  sectionPadding: responsive.getValue(16, 20, 24),
};

// Enhanced typography - responsive
export const typography = {
  fontSize: {
    xs: responsive.moderateScale(10),
    sm: responsive.moderateScale(12),
    base: responsive.moderateScale(14),
    md: responsive.moderateScale(16),
    lg: responsive.moderateScale(18),
    xl: responsive.moderateScale(20),
    xxl: responsive.moderateScale(24),
    xxxl: responsive.moderateScale(32),
    display: responsive.moderateScale(40),
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Color system with WCAG AA compliant contrast ratios
export const colors = {
  // Primary colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Role-based colors
  roles: {
    patient: '#3B82F6',
    doctor: '#10B981',
    pharmacist: '#8B5CF6',
    labTechnician: '#F59E0B',
    admin: '#EF4444',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
  
  // Text colors with proper contrast
  text: {
    primary: '#111827',      // Contrast ratio 16.5:1 on white
    secondary: '#4B5563',    // Contrast ratio 7:1 on white
    tertiary: '#6B7280',     // Contrast ratio 4.5:1 on white
    disabled: '#9CA3AF',     // Contrast ratio 2.8:1 on white
    inverse: '#FFFFFF',      // For dark backgrounds
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

// Border radius system
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow system - platform aware
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
};

// Accessibility helpers
export const accessibility = {
  // Minimum touch target size (48x48 per WCAG)
  minTouchTarget: 48,
  
  // Recommended touch target size
  touchTarget: {
    small: 44,
    medium: 48,
    large: 56,
  },
  
  // Screen reader labels
  labels: {
    button: 'button',
    link: 'link',
    image: 'image',
    text: 'text',
    header: 'header',
    search: 'search',
    menu: 'menu',
    navigation: 'navigation',
    list: 'list',
    listItem: 'listitem',
  },
  
  // Helper to create accessible props
  createProps: (label: string, hint?: string, role?: string) => ({
    accessible: true,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
    ...(role && { accessibilityRole: role as any }),
  }),
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Layout utilities
export const layout = {
  // Container widths
  containerWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Grid columns
  gridColumns: responsive.getValue(1, 2, 3),
  
  // Card dimensions
  cardMinHeight: responsive.getValue(100, 120, 140),
  cardMaxWidth: responsive.getValue(width - 32, 400, 500),
  
  // Header heights
  headerHeight: responsive.getValue(60, 70, 80),
  tabBarHeight: responsive.getValue(60, 70, 80),
  
  // Safe area insets (approximate)
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  },
};

// Z-index system
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
};

// Opacity levels
export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  pressed: 0.6,
  overlay: 0.5,
  backdrop: 0.7,
};

// Export all as design system
export const designSystem = {
  breakpoints,
  deviceType,
  responsive,
  spacing,
  typography,
  colors,
  borderRadius,
  shadows,
  accessibility,
  animation,
  layout,
  zIndex,
  opacity,
};

export default designSystem;
