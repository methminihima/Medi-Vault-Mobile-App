// hooks/use-theme-color.ts

import { Colors } from '../constants/theme';
// Import the stable useTheme from the new context file
import { useTheme } from './use-theme'; 

// NOTE: You may need to create a simple './use-color-scheme.ts' that just re-exports 
// useRNColorScheme or remove it if useTheme is the only hook you need.
// For simplicity, we'll keep the import in the original form if it exists, but 
// the actual resolution should come from the stable context.

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Use the stable theme from the ThemeProvider context
  const theme = useTheme(); 
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
