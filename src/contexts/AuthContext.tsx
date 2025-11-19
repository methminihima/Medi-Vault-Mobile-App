import { authAPI } from '@/src/api/auth';
import { STORAGE_KEYS } from '@/src/config/constants';
import { storageService } from '@/src/services/storageService';
import { AuthState, LoginCredentials, RegisterData } from '@/src/types/auth';
import { User } from '@/src/types/models';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    biometricEnabled: false,
  });

  const router = useRouter();
  const segments = useSegments();

  // Check stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (authState.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!authState.isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (authState.isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [authState.isAuthenticated, authState.isLoading, segments]);

  const loadStoredAuth = async () => {
    try {
      const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      const user = await storageService.getItem<User>(STORAGE_KEYS.USER_DATA);

      if (token && user) {
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          biometricEnabled: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      // Store auth data
      await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storageService.setItem(STORAGE_KEYS.USER_DATA, user);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;

      // Store auth data
      await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await storageService.setItem(STORAGE_KEYS.USER_DATA, user);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear storage
      await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storageService.removeItem(STORAGE_KEYS.USER_DATA);

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        biometricEnabled: false,
      });

      router.replace('/(auth)/login');
    }
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({ ...prev, user }));
    storageService.setItem(STORAGE_KEYS.USER_DATA, user);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
