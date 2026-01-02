// hooks/use-color-scheme.ts
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

// Explicitly use the native hook that might return null/undefined initially
export function useColorScheme() {
  return useRNColorScheme();
}
