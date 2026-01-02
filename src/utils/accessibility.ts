import { AccessibilityProps, Platform } from 'react-native';

/**
 * Accessibility Utilities
 * Provides helpers for creating accessible components
 */

// Accessibility roles
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar';

interface AccessibilityPropsConfig {
  label: string;
  hint?: string;
  role?: AccessibilityRole;
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  live?: 'polite' | 'assertive' | 'none';
  atomic?: boolean;
}

/**
 * Create comprehensive accessibility props for a component
 */
export const createAccessibilityProps = ({
  label,
  hint,
  role,
  state,
  value,
  live,
  atomic,
}: AccessibilityPropsConfig): AccessibilityProps => {
  const props: AccessibilityProps = {
    accessible: true,
    accessibilityLabel: label,
  };

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (role) {
    props.accessibilityRole = role;
  }

  if (state) {
    props.accessibilityState = state;
  }

  if (value) {
    props.accessibilityValue = value;
  }

  if (live) {
    props.accessibilityLiveRegion = live;
  }

  if (atomic !== undefined && Platform.OS === 'android') {
    props.accessibilityViewIsModal = atomic;
  }

  return props;
};

/**
 * Button accessibility props
 */
export const buttonA11yProps = (
  label: string,
  hint?: string,
  disabled = false
) => createAccessibilityProps({
  label,
  hint,
  role: 'button',
  state: { disabled },
});

/**
 * Link accessibility props
 */
export const linkA11yProps = (label: string, hint?: string) =>
  createAccessibilityProps({
    label,
    hint,
    role: 'link',
  });

/**
 * Image accessibility props
 */
export const imageA11yProps = (altText: string) =>
  createAccessibilityProps({
    label: altText,
    role: 'image',
  });

/**
 * Header accessibility props
 */
export const headerA11yProps = (label: string, level?: number) =>
  createAccessibilityProps({
    label,
    role: 'header',
    ...(level && { value: { now: level } }),
  });

/**
 * Text input accessibility props
 */
export const textInputA11yProps = (
  label: string,
  hint?: string,
  required = false
) => createAccessibilityProps({
  label: required ? `${label}, required` : label,
  hint,
  role: 'none', // Text input has implicit role
});

/**
 * Checkbox accessibility props
 */
export const checkboxA11yProps = (
  label: string,
  checked: boolean,
  hint?: string
) => createAccessibilityProps({
  label,
  hint,
  role: 'checkbox',
  state: { checked },
});

/**
 * Radio button accessibility props
 */
export const radioA11yProps = (
  label: string,
  selected: boolean,
  hint?: string
) => createAccessibilityProps({
  label,
  hint,
  role: 'radio',
  state: { selected },
});

/**
 * Switch accessibility props
 */
export const switchA11yProps = (
  label: string,
  checked: boolean,
  hint?: string
) => createAccessibilityProps({
  label,
  hint,
  role: 'switch',
  state: { checked },
});

/**
 * Tab accessibility props
 */
export const tabA11yProps = (
  label: string,
  selected: boolean,
  index: number,
  total: number
) => createAccessibilityProps({
  label: `${label}, ${index + 1} of ${total}`,
  role: 'tab',
  state: { selected },
});

/**
 * Alert accessibility props (for notifications, toasts)
 */
export const alertA11yProps = (message: string, polite = true) =>
  createAccessibilityProps({
    label: message,
    role: 'alert',
    live: polite ? 'polite' : 'assertive',
  });

/**
 * Progress bar accessibility props
 */
export const progressA11yProps = (
  label: string,
  value: number,
  min = 0,
  max = 100
) => createAccessibilityProps({
  label: `${label}, ${Math.round((value / max) * 100)}% complete`,
  role: 'progressbar',
  value: { min, max, now: value },
});

/**
 * List accessibility props
 */
export const listA11yProps = (label: string, itemCount: number) =>
  createAccessibilityProps({
    label: `${label}, ${itemCount} items`,
    role: 'none',
  });

/**
 * List item accessibility props
 */
export const listItemA11yProps = (
  label: string,
  index: number,
  total: number
) => createAccessibilityProps({
  label: `${label}, ${index + 1} of ${total}`,
  role: 'menuitem',
});

/**
 * Card/Container accessibility props
 */
export const cardA11yProps = (label: string, hint?: string) =>
  createAccessibilityProps({
    label,
    hint,
    role: 'none',
  });

/**
 * Navigation item accessibility props
 */
export const navItemA11yProps = (
  label: string,
  selected: boolean,
  hint?: string
) => createAccessibilityProps({
  label,
  hint: hint || `Navigate to ${label}`,
  role: 'button',
  state: { selected },
});

/**
 * Announce message to screen reader
 * Use for dynamic content updates
 */
export const announceForAccessibility = (message: string) => {
  if (Platform.OS === 'ios') {
    // iOS uses AccessibilityInfo
    const AccessibilityInfo = require('react-native').AccessibilityInfo;
    AccessibilityInfo.announceForAccessibility(message);
  } else if (Platform.OS === 'android') {
    // Android uses AccessibilityInfo
    const AccessibilityInfo = require('react-native').AccessibilityInfo;
    AccessibilityInfo.announceForAccessibility(message);
  }
};

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    const AccessibilityInfo = require('react-native').AccessibilityInfo;
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch {
    return false;
  }
};

/**
 * Focus on element (for keyboard navigation)
 */
export const setAccessibilityFocus = (ref: any) => {
  if (ref && ref.current) {
    const AccessibilityInfo = require('react-native').AccessibilityInfo;
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  }
};

/**
 * Combine multiple accessibility props
 */
export const combineA11yProps = (
  ...props: Array<AccessibilityProps | undefined>
): AccessibilityProps => {
  return props.reduce<AccessibilityProps>((acc, prop) => {
    if (!prop) return acc;
    return { ...acc, ...prop };
  }, {});
};

/**
 * Format number for accessibility (reads better with screen readers)
 */
export const formatNumberForA11y = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
};

/**
 * Format date for accessibility
 */
export const formatDateForA11y = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString(undefined, options);
};

/**
 * Format time for accessibility
 */
export const formatTimeForA11y = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return date.toLocaleTimeString(undefined, options);
};

export default {
  createAccessibilityProps,
  buttonA11yProps,
  linkA11yProps,
  imageA11yProps,
  headerA11yProps,
  textInputA11yProps,
  checkboxA11yProps,
  radioA11yProps,
  switchA11yProps,
  tabA11yProps,
  alertA11yProps,
  progressA11yProps,
  listA11yProps,
  listItemA11yProps,
  cardA11yProps,
  navItemA11yProps,
  announceForAccessibility,
  isScreenReaderEnabled,
  setAccessibilityFocus,
  combineA11yProps,
  formatNumberForA11y,
  formatDateForA11y,
  formatTimeForA11y,
};
