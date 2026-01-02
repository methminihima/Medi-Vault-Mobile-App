// app/_layout.tsx OR App.tsx (Your Root Component)

import React, { useEffect, useState } from 'react';
import { View, useColorScheme, StatusBar } from 'react-native';
import { Stack } from 'expo-router'; // Example for Expo Router setup
import { Colors } from '../constants/theme'; // Import your Colors definition
// Assuming your other theme-related components are here
// import { ThemeProvider } from 'some-context-provider'; 

// --- Theme Loading Guard Implementation ---
function ThemeLoaderGuard({ children }: { children: React.ReactNode }) {
  const theme = useColorScheme(); // 'light', 'dark', or null/undefined on initial load
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Define a static, neutral background color to prevent the initial flash
  // This should ideally match your native splash screen background color.
  const staticFallbackColor = Colors.light.background; // Assuming your light theme background is a safe default (e.g., 'white')

  useEffect(() => {
    // Once the theme is a string ('light' or 'dark'), we know it's resolved.
    if (theme) {
      setIsThemeLoaded(true);
    }
  }, [theme]);

  if (!isThemeLoaded) {
    // While the theme is resolving, render a simple, static view.
    // This prevents ThemedView/ThemedText from attempting to calculate colors 
    // with an uncertain theme, eliminating the flicker.
    return (
      <View style={{ flex: 1, backgroundColor: staticFallbackColor }}>
        {/* Optional: Add a simple loading indicator or logo here */}
        <StatusBar barStyle="default" />
      </View>
    );
  }

  // Once the theme is loaded, render the actual app content.
  return <>{children}</>;
}


// --- Root Layout Component ---
export default function RootLayout() {
  
  // Replace <Stack /> with your main navigation component if not using Expo Router
  return (
    <ThemeLoaderGuard>
      {/* This is where your main app content or navigation lives.
        Example using Expo Router's Stack: 
      */}
      <Stack /> 
    </ThemeLoaderGuard>
  );
}