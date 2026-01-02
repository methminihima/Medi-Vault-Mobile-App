import { Dimensions, ImageStyle, Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { designSystem } from '../config/designSystem';

const { width, height } = Dimensions.get('window');

type Style = ViewStyle | TextStyle | ImageStyle;
type ResponsiveStyle = Style | ((params: typeof designSystem.deviceType) => Style);

/**
 * Create responsive styles based on device type
 */
export const createResponsiveStyles = <T extends { [key: string]: ResponsiveStyle }>(
  styles: T
): { [K in keyof T]: Style } => {
  const responsiveStyles: any = {};
  
  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    if (typeof style === 'function') {
      responsiveStyles[key] = style(designSystem.deviceType);
    } else {
      responsiveStyles[key] = style;
    }
  });
  
  return StyleSheet.create(responsiveStyles);
};

/**
 * Create styles that adapt to screen orientation
 */
export const createOrientationStyles = <T extends { [key: string]: Style }>(
  portraitStyles: T,
  landscapeStyles: Partial<T>
): { [K in keyof T]: Style } => {
  const isLandscape = width > height;
  
  if (!isLandscape) {
    return StyleSheet.create(portraitStyles);
  }
  
  const merged: any = { ...portraitStyles };
  Object.keys(landscapeStyles).forEach((key) => {
    merged[key] = { ...portraitStyles[key], ...landscapeStyles[key] };
  });
  
  return StyleSheet.create(merged);
};

/**
 * Create grid layout based on device type
 */
export const createGridLayout = (
  itemMinWidth: number,
  gap: number = designSystem.spacing.md
) => {
  const containerWidth = width - (designSystem.spacing.containerPadding * 2);
  const columns = Math.floor(containerWidth / (itemMinWidth + gap));
  const itemWidth = (containerWidth - (gap * (columns - 1))) / columns;
  
  return {
    columns,
    itemWidth,
    gap,
  };
};

/**
 * Common responsive layout styles
 */
export const commonStyles = createResponsiveStyles({
  // Containers
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
  },
  
  containerPadded: {
    flex: 1,
    padding: designSystem.spacing.containerPadding,
    backgroundColor: designSystem.colors.background.primary,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: designSystem.spacing.xl,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.containerPadding,
  },
  
  // Cards
  card: (device) => ({
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: device.isTablet ? designSystem.spacing.lg : designSystem.spacing.md,
    ...designSystem.shadows.md,
    marginBottom: designSystem.spacing.md,
  }),
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  
  cardTitle: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.xl 
      : designSystem.typography.fontSize.lg,
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
  }),
  
  cardSubtitle: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.md 
      : designSystem.typography.fontSize.base,
    color: designSystem.colors.text.secondary,
    marginTop: designSystem.spacing.xs,
  }),
  
  // Buttons
  button: (device) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: device.isTablet ? 16 : 14,
    paddingHorizontal: device.isTablet ? designSystem.spacing.xl : designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.md,
    minHeight: designSystem.accessibility.touchTarget.medium,
    ...designSystem.shadows.sm,
  }),
  
  buttonPrimary: {
    backgroundColor: designSystem.colors.primary[600],
  },
  
  buttonSecondary: {
    backgroundColor: designSystem.colors.gray[100],
    borderWidth: 1,
    borderColor: designSystem.colors.border.light,
  },
  
  buttonText: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.md 
      : designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: '#FFFFFF',
  }),
  
  buttonTextSecondary: {
    color: designSystem.colors.text.primary,
  },
  
  // Inputs
  input: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.md 
      : designSystem.typography.fontSize.base,
    color: designSystem.colors.text.primary,
    backgroundColor: designSystem.colors.background.secondary,
    borderWidth: 1,
    borderColor: designSystem.colors.border.light,
    borderRadius: designSystem.borderRadius.md,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: device.isTablet ? 16 : 12,
    minHeight: designSystem.accessibility.touchTarget.medium,
  }),
  
  inputFocused: {
    borderColor: designSystem.colors.primary[500],
    backgroundColor: designSystem.colors.background.primary,
  },
  
  inputError: {
    borderColor: designSystem.colors.error,
    backgroundColor: designSystem.colors.errorLight,
  },
  
  // Typography
  heading1: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.display 
      : designSystem.typography.fontSize.xxxl,
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    lineHeight: device.isTablet ? 48 : 40,
  }),
  
  heading2: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.xxxl 
      : designSystem.typography.fontSize.xxl,
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    lineHeight: device.isTablet ? 40 : 32,
  }),
  
  heading3: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.xxl 
      : designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
  }),
  
  bodyLarge: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.lg 
      : designSystem.typography.fontSize.md,
    color: designSystem.colors.text.primary,
    lineHeight: device.isTablet ? 28 : 24,
  }),
  
  bodyRegular: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.md 
      : designSystem.typography.fontSize.base,
    color: designSystem.colors.text.primary,
    lineHeight: device.isTablet ? 24 : 21,
  }),
  
  bodySmall: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.base 
      : designSystem.typography.fontSize.sm,
    color: designSystem.colors.text.secondary,
    lineHeight: device.isTablet ? 21 : 18,
  }),
  
  caption: {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.text.tertiary,
  },
  
  // Flexbox utilities
  row: {
    flexDirection: 'row',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  // Spacing utilities
  mt: {
    marginTop: designSystem.spacing.md,
  },
  
  mb: {
    marginBottom: designSystem.spacing.md,
  },
  
  ml: {
    marginLeft: designSystem.spacing.md,
  },
  
  mr: {
    marginRight: designSystem.spacing.md,
  },
  
  mx: {
    marginHorizontal: designSystem.spacing.md,
  },
  
  my: {
    marginVertical: designSystem.spacing.md,
  },
  
  pt: {
    paddingTop: designSystem.spacing.md,
  },
  
  pb: {
    paddingBottom: designSystem.spacing.md,
  },
  
  pl: {
    paddingLeft: designSystem.spacing.md,
  },
  
  pr: {
    paddingRight: designSystem.spacing.md,
  },
  
  px: {
    paddingHorizontal: designSystem.spacing.md,
  },
  
  py: {
    paddingVertical: designSystem.spacing.md,
  },
  
  // Grid
  grid: (device) => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -designSystem.spacing.sm,
  }),
  
  gridItem: (device) => ({
    width: device.isTablet 
      ? `${100 / 3}%` as any
      : device.isPhone 
        ? `${100 / 2}%` as any
        : '100%',
    padding: designSystem.spacing.sm,
  }),
  
  // Lists
  listItem: (device) => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: device.isTablet ? designSystem.spacing.lg : designSystem.spacing.md,
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    minHeight: designSystem.accessibility.touchTarget.medium,
    ...designSystem.shadows.xs,
  }),
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: designSystem.colors.border.light,
    marginVertical: designSystem.spacing.md,
  },
  
  // Badges
  badge: {
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.full,
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    fontSize: designSystem.typography.fontSize.xs,
    fontWeight: designSystem.typography.fontWeight.semibold,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xl,
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xl,
  },
  
  emptyStateText: (device) => ({
    fontSize: device.isTablet 
      ? designSystem.typography.fontSize.lg 
      : designSystem.typography.fontSize.md,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    marginTop: designSystem.spacing.md,
  }),
});

/**
 * Platform-specific styles
 */
export const platformStyles = StyleSheet.create({
  webContainer: Platform.select({
    web: {
      maxWidth: designSystem.layout.containerWidth.lg,
      marginHorizontal: 'auto' as any,
      width: '100%',
    },
    default: {},
  }),
  
  webScroll: Platform.select({
    web: {
      height: '100vh' as any,
    },
    default: {
      flex: 1,
    },
  }),
});

export default {
  createResponsiveStyles,
  createOrientationStyles,
  createGridLayout,
  commonStyles,
  platformStyles,
};
