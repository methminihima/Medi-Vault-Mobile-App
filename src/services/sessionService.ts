/**
 * Session Management Service
 * Handles session validation, refresh, and persistence
 */

import { authApi } from '../api/auth';
import { storageService } from './storageService';

class SessionService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;

  /**
   * Check if user has a valid session
   * @returns Promise<boolean>
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const token = await storageService.getToken();
      if (!token) return false;

      const isValid = await storageService.isSessionValid();
      return isValid;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Validate session with backend
   * @returns Promise<boolean>
   */
  async validateSession(): Promise<boolean> {
    try {
      const hasSession = await this.hasValidSession();
      if (!hasSession) return false;

      // Check if this is a test user (skip API call)
      const token = await storageService.getToken();
      if (token && token.startsWith('test-token-')) {
        return true; // Test users are always valid
      }

      const response = await authApi.getCurrentUser();
      return !!response.data;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Refresh session token
   * @returns Promise<boolean>
   */
  async refreshSession(): Promise<boolean> {
    if (this.isRefreshing) return false;

    try {
      this.isRefreshing = true;
      
      // Check if this is a test user (skip API call)
      const token = await storageService.getToken();
      if (token && token.startsWith('test-token-')) {
        // Extend session expiry for test users
        const rememberMe = await storageService.getRememberMe();
        const expiryTime = rememberMe
          ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          : Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        await storageService.setSessionExpiry(expiryTime);
        return true;
      }
      
      const response = await authApi.refreshSession();
      const { token: newToken, user, sessionId } = response.data as any;

      if (newToken) {
        await storageService.setToken(newToken);
        if (user) {
          await storageService.setUser(user);
        }
        if (sessionId) {
          await storageService.setSessionId(sessionId);
        }

        // Extend session expiry
        const rememberMe = await storageService.getRememberMe();
        const expiryTime = rememberMe
          ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          : Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        await storageService.setSessionExpiry(expiryTime);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Restore session on app launch
   * @returns Promise<{ isValid: boolean; user: any | null }>
   */
  async restoreSession(): Promise<{ isValid: boolean; user: any | null }> {
    try {
      const hasSession = await this.hasValidSession();
      
      if (!hasSession) {
        return { isValid: false, user: null };
      }

      // Try to validate with backend
      const isValid = await this.validateSession();
      
      if (!isValid) {
        // Session expired, try to refresh
        const refreshed = await this.refreshSession();
        
        if (refreshed) {
          const user = await storageService.getUser();
          return { isValid: true, user };
        }
        
        // Refresh failed, clear session
        await this.clearSession();
        return { isValid: false, user: null };
      }

      const user = await storageService.getUser();
      return { isValid: true, user };
    } catch (error) {
      console.error('Error restoring session:', error);
      await this.clearSession();
      return { isValid: false, user: null };
    }
  }

  /**
   * Start auto-refresh timer
   * Refreshes session 5 minutes before expiry
   */
  async startAutoRefresh(): Promise<void> {
    try {
      const expiry = await storageService.getSessionExpiry();
      if (!expiry) return;

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before expiry

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(async () => {
          const refreshed = await this.refreshSession();
          if (refreshed) {
            // Schedule next refresh
            await this.startAutoRefresh();
          }
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error starting auto-refresh:', error);
    }
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    try {
      this.stopAutoRefresh();
      await storageService.clearSession();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Get session info
   * @returns Promise<{ token: string | null; user: any | null; expiresAt: number | null; sessionId: string | null }>
   */
  async getSessionInfo(): Promise<{
    token: string | null;
    user: any | null;
    expiresAt: number | null;
    sessionId: string | null;
  }> {
    try {
      const [token, user, expiresAt, sessionId] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
        storageService.getSessionExpiry(),
        storageService.getSessionId(),
      ]);

      return { token, user, expiresAt, sessionId };
    } catch (error) {
      console.error('Error getting session info:', error);
      return { token: null, user: null, expiresAt: null, sessionId: null };
    }
  }

  /**
   * Check if session is about to expire (within 10 minutes)
   * @returns Promise<boolean>
   */
  async isSessionExpiringSoon(): Promise<boolean> {
    try {
      const expiry = await storageService.getSessionExpiry();
      if (!expiry) return false;

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      return timeUntilExpiry > 0 && timeUntilExpiry < (10 * 60 * 1000); // Less than 10 minutes
    } catch (error) {
      console.error('Error checking session expiry:', error);
      return false;
    }
  }
}

export const sessionService = new SessionService();
