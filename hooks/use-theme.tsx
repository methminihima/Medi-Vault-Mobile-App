// hooks/use-theme.tsx

import React, { createContext, useContext } from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';

// Create context (undefined means provider not mounted)
const ThemeContext = createContext<ThemeMode | undefined>(undefined);

// Hook used by ThemedView / ThemedText
export function useTheme(): ThemeMode {
  const value = useContext(ThemeContext);
  if (!value) {
    return 'light';
  }
  return value;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = Appearance.getColorScheme(); // "light" | "dark" | null
  const theme: ThemeMode = systemTheme === 'dark' ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

