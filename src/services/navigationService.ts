import { sessionService } from './sessionService';
import { storageService } from './storageService';

/**
 * Navigation Service
 * Provides optimized navigation guards and authentication checks
 * Reduces redundant storage polling and improves performance
 */

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  lastChecked: number;
}

class NavigationService {
  private authCache: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    lastChecked: 0,
  };

  private CACHE_DURATION = 2000; // Cache auth state for 2 seconds
  private isCheckingAuth = false;
  private authCheckPromise: Promise<AuthState> | null = null;

  /**
   * Get cached authentication state or check storage
   * Prevents multiple simultaneous storage checks
   */
  async getAuthState(forceRefresh = false): Promise<AuthState> {
    const now = Date.now();
    const cacheValid = now - this.authCache.lastChecked < this.CACHE_DURATION;

    // Return cached state if valid and not forcing refresh
    if (cacheValid && !forceRefresh) {
      return this.authCache;
    }

    // If already checking, return the existing promise
    if (this.isCheckingAuth && this.authCheckPromise) {
      return this.authCheckPromise;
    }

    // Perform auth check
    this.isCheckingAuth = true;
    this.authCheckPromise = this._checkAuthState();

    try {
      const state = await this.authCheckPromise;
      this.authCache = { ...state, lastChecked: now };
      return state;
    } finally {
      this.isCheckingAuth = false;
      this.authCheckPromise = null;
    }
  }

  /**
   * Internal method to check authentication state
   */
  private async _checkAuthState(): Promise<AuthState> {
    try {
      const [token, user] = await Promise.all([
        storageService.getToken(),
        storageService.getUser(),
      ]);

      return {
        isAuthenticated: !!(token && user),
        user,
        token,
        lastChecked: Date.now(),
      };
    } catch (error) {
      if (__DEV__) {
        console.error('[NavigationService] Error checking auth state:', error);
      }
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Clear authentication cache
   * Call this after login/logout to force auth state refresh
   */
  clearAuthCache(): void {
    this.authCache = {
      isAuthenticated: false,
      user: null,
      token: null,
      lastChecked: 0,
    };
  }

  /**
   * Update cached auth state without storage check
   * Use this after successful login/logout
   */
  updateAuthCache(user: any | null, token: string | null): void {
    this.authCache = {
      isAuthenticated: !!(token && user),
      user,
      token,
      lastChecked: Date.now(),
    };
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole: string | string[]): boolean {
    if (!this.authCache.user) return false;
    
    const userRole = this.authCache.user.role;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
  }

  /**
   * Get dashboard route for user role
   */
  getDashboardRoute(role?: string): string {
    const userRole = role || this.authCache.user?.role;
    
    switch (userRole) {
      case 'doctor':
        return '/(tabs)/doctor-dashboard';
      case 'admin':
        return '/(tabs)/admin-dashboard';
      case 'pharmacist':
        return '/(tabs)/pharmacist-dashboard';
      case 'lab_technician':
        return '/(tabs)/lab-technician-dashboard';
      case 'patient':
      default:
        return '/(tabs)/index';
    }
  }

  /**
   * Check if route requires authentication
   */
  isProtectedRoute(segment: string): boolean {
    const protectedRoutes = ['(tabs)'];
    return protectedRoutes.includes(segment);
  }

  /**
   * Check if route is auth-only (shouldn't access when authenticated)
   */
  isAuthOnlyRoute(segment: string, page?: string): boolean {
    if (segment !== '(auth)') return false;
    const authOnlyPages = ['login', 'register', 'forgot-password'];
    return page ? authOnlyPages.includes(page) : false;
  }

  /**
   * Perform logout and clear all auth data
   */
  async logout(): Promise<void> {
    try {
      await sessionService.clearSession();
      this.clearAuthCache();
    } catch (error) {
      if (__DEV__) {
        console.error('[NavigationService] Error during logout:', error);
      }
      throw error;
    }
  }

  /**
   * Initialize session on app start
   */
  async initializeSession(): Promise<AuthState> {
    try {
      const { isValid, user } = await sessionService.restoreSession();
      
      if (isValid && user) {
        const token = await storageService.getToken();
        this.updateAuthCache(user, token);
        await sessionService.startAutoRefresh();
        return this.authCache;
      } else {
        this.clearAuthCache();
        return this.authCache;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[NavigationService] Error initializing session:', error);
      }
      this.clearAuthCache();
      return this.authCache;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    sessionService.stopAutoRefresh();
    this.clearAuthCache();
  }
}

export const navigationService = new NavigationService();
export default navigationService;
