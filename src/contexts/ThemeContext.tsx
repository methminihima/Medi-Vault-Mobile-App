import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../config/theme';
import { storageService } from '../services/storageService';

type ThemeName = 'light' | 'dark';

type AppThemeContextType = {
  themeName: ThemeName;
  setThemeName: (t: ThemeName) => void;
  toggleTheme: () => void;
  theme: Theme;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = useColorScheme() ?? 'light';
  const [themeName, setThemeNameState] = useState<ThemeName>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storageService.getTheme();
        if (mounted && stored) {
          setThemeNameState(stored);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeName = (t: ThemeName) => {
    setThemeNameState(t);
    storageService.setTheme(t).catch(() => {});
  };

  const toggleTheme = () => {
    setThemeName(themeName === 'dark' ? 'light' : 'dark');
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <AppThemeContext.Provider value={{ themeName, setThemeName, toggleTheme, theme }}>
      <NavigationThemeProvider value={theme}>{children}</NavigationThemeProvider>
    </AppThemeContext.Provider>
  );
};

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}

export default AppThemeProvider;
