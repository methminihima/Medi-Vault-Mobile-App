/**
 * Central export point for all navigation and UI/UX utilities
 * Import from this file for convenience
 */

// Design System
export { accessibility as a11yHelpers, animation, borderRadius, breakpoints, colors, designSystem, deviceType, layout, opacity, responsive, shadows, spacing, typography, zIndex } from './config/designSystem';

// Accessibility
export { default as accessibilityUtils, alertA11yProps, announceForAccessibility, buttonA11yProps, cardA11yProps, checkboxA11yProps, combineA11yProps, createAccessibilityProps, formatDateForA11y, formatNumberForA11y, formatTimeForA11y, headerA11yProps, imageA11yProps, isScreenReaderEnabled, linkA11yProps, listA11yProps, listItemA11yProps, navItemA11yProps, progressA11yProps, radioA11yProps, setAccessibilityFocus, switchA11yProps, tabA11yProps, textInputA11yProps } from './utils/accessibility';

// Responsive Styles
export { commonStyles, createGridLayout, createOrientationStyles, createResponsiveStyles, platformStyles, default as responsiveUtils } from './utils/responsiveStyles';

// Navigation
export { useNavigationGuard } from './hooks/useNavigationGuard';
export { navigationService } from './services/navigationService';

// Session Management
export { sessionService } from './services/sessionService';
export { storageService } from './services/storageService';

// Types
export type { AccessibilityRole } from './utils/accessibility';
