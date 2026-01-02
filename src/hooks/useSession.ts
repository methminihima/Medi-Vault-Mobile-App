/**
 * useSession Hook
 * Provides session state and management functions
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { sessionService } from '../services/sessionService';
import { storageService } from '../services/storageService';

interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  token: string | null;
}

interface UseSessionReturn extends SessionState {
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  });

  const checkSession = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { isValid, user } = await sessionService.restoreSession();

      if (isValid && user) {
        const token = await storageService.getToken();
        setState({
          isAuthenticated: true,
          isLoading: false,
          user,
          token,
        });

        // Start auto-refresh
        await sessionService.startAutoRefresh();
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
        });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    }
  };

  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await sessionService.clearSession();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const success = await sessionService.refreshSession();
      
      if (success) {
        const [user, token] = await Promise.all([
          storageService.getUser(),
          storageService.getToken(),
        ]);
        
        setState((prev) => ({
          ...prev,
          user,
          token,
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSession();

    // Cleanup
    return () => {
      sessionService.stopAutoRefresh();
    };
  }, []);

  return {
    ...state,
    logout,
    refreshSession,
    checkSession,
  };
}
