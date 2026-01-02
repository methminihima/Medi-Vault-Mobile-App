// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '../hooks/use-color-scheme';
import { ThemeProvider } from '../hooks/use-theme';
import { sessionService } from '../src/services/sessionService';
import { storageService } from '../src/services/storageService';
import { queryClient } from '../src/store/queryClient';

export const unstable_settings = {
  initialRouteName: '(auth)/landing-page',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const segments = useSegments();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on app launch and whenever user storage changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { isValid, user } = await sessionService.restoreSession();
        
        if (isValid && user) {
          setIsAuthenticated(true);
          await sessionService.startAutoRefresh();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      sessionService.stopAutoRefresh();
    };
  }, []);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (isLoading) return;

    const checkAuthAndNavigate = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const currentAuthPage: string = segments.length > 1 ? (segments as string[])[1] : '';

      // Check current authentication status from storage
      const token = await storageService.getToken();
      const user = await storageService.getUser();
      const currentlyAuthenticated = !!(token && user);

      console.log('Navigation guard:', { 
        inAuthGroup, 
        inTabsGroup, 
        currentAuthPage,
        currentlyAuthenticated,
        userRole: user?.role 
      });

      // Update auth state if it changed
      if (currentlyAuthenticated !== isAuthenticated) {
        setIsAuthenticated(currentlyAuthenticated);
      }

      // Only redirect if trying to access protected routes without authentication
      if (!currentlyAuthenticated && inTabsGroup) {
        console.log('Not authenticated, redirecting to landing page');
        router.replace('/(auth)/landing-page' as any);
        return;
      }

      // If authenticated and on login/register page, redirect to dashboard
      if (currentlyAuthenticated && inAuthGroup && (currentAuthPage === 'login' || currentAuthPage === 'register' || currentAuthPage === 'forgot-password')) {
        console.log('Authenticated on auth page, redirecting to dashboard');
        
        if (user?.role === 'doctor') {
          router.replace('/(tabs)/doctor-dashboard' as any);
        } else if (user?.role === 'admin') {
          router.replace('/(tabs)/admin-dashboard' as any);
        } else if (user?.role === 'pharmacist') {
          router.replace('/(tabs)/pharmacist-dashboard' as any);
        } else if (user?.role === 'lab_technician') {
          router.replace('/(tabs)/lab-technician-dashboard' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      }
    };

    checkAuthAndNavigate();
  }, [segments, isLoading]);

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <ActivityIndicator size="large" color="#1E4BA3ff" />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {/* Expo Router navigation */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>

      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  // Add error boundary
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Catch and log any unhandled errors
    const errorHandler = (error: ErrorEvent) => {
      console.error('Global error:', error);
      setHasError(true);
    };
    
    // Error handling is already set up globally in errorHandler.ts
    // React Native uses ErrorUtils instead of window.addEventListener
  }, []);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#1E4BA3ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ✅ Your custom theme provider MUST be the outermost wrapper */}
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

