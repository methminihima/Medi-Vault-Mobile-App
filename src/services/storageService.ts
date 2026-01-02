import { STORAGE_KEYS } from '@config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@types/models';

/**
 * Provide a promise-based wrapper around MMKV (which is synchronous)
 * and fall back to AsyncStorage when MMKV is not available (e.g. web).
 */
type MMKVLike = {
  getString: (key: string) => Promise<string | null> | string | null;
  set: (key: string, value: string | boolean) => Promise<void> | void;
  delete: (key: string) => Promise<void> | void;
  getBoolean?: (key: string) => Promise<boolean> | boolean;
  clearAll?: () => Promise<void> | void;
};

let mmkvStorage: MMKVLike;

try {
  // Try to create an MMKV instance. On environments where MMKV isn't
  // available this will throw (for example running in Expo web).
  // Wrap synchronous MMKV methods to return Promises so callers can
  // `await` them uniformly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const real = new (MMKV as any)();

  mmkvStorage = {
    getString: (k: string) => Promise.resolve(real.getString(k)),
    set: (k: string, v: string | boolean) => Promise.resolve(real.set(k, v)),
    delete: (k: string) => Promise.resolve(real.delete(k)),
    getBoolean: (k: string) => Promise.resolve(typeof real.getBoolean === 'function' ? real.getBoolean(k) : !!real.getString(k)),
    clearAll: () => Promise.resolve(typeof real.clearAll === 'function' ? real.clearAll() : undefined),
  };
} catch (error) {
  // Fallback implementation using AsyncStorage (async API)
  mmkvStorage = {
    getString: (k: string) => AsyncStorage.getItem(k),
    set: (k: string, v: string | boolean) => AsyncStorage.setItem(k, String(v)),
    delete: (k: string) => AsyncStorage.removeItem(k),
    getBoolean: async (k: string) => (await AsyncStorage.getItem(k)) === 'true',
    clearAll: () => AsyncStorage.clear(),
  };
}

/**
 * Storage Service - Handles all persistent storage operations
 */
class StorageService {
  /**
   * Token Management (using MMKV for speed)
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await mmkvStorage.getString(STORAGE_KEYS.AUTH_TOKEN);
      return token || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await mmkvStorage.delete(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  /**
   * Session Management
   */
  async getSessionId(): Promise<string | null> {
    try {
      const sessionId = await mmkvStorage.getString(STORAGE_KEYS.SESSION_ID);
      return sessionId || null;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return null;
    }
  }

  async setSessionId(sessionId: string): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.SESSION_ID, sessionId);
    } catch (error) {
      console.error('Error setting session ID:', error);
    }
  }

  async removeSessionId(): Promise<void> {
    try {
      await mmkvStorage.delete(STORAGE_KEYS.SESSION_ID);
    } catch (error) {
      console.error('Error removing session ID:', error);
    }
  }

  async getSessionExpiry(): Promise<number | null> {
    try {
      const expiry = await mmkvStorage.getString(STORAGE_KEYS.SESSION_EXPIRY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('Error getting session expiry:', error);
      return null;
    }
  }

  async setSessionExpiry(timestamp: number): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.SESSION_EXPIRY, timestamp.toString());
    } catch (error) {
      console.error('Error setting session expiry:', error);
    }
  }

  async removeSessionExpiry(): Promise<void> {
    try {
      await mmkvStorage.delete(STORAGE_KEYS.SESSION_EXPIRY);
    } catch (error) {
      console.error('Error removing session expiry:', error);
    }
  }

  async isSessionValid(): Promise<boolean> {
    try {
      const expiry = await this.getSessionExpiry();
      if (!expiry) return false;
      return Date.now() < expiry;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  async getRememberMe(): Promise<boolean> {
    try {
      const rememberMe = await (mmkvStorage.getBoolean ? mmkvStorage.getBoolean(STORAGE_KEYS.REMEMBER_ME) : Promise.resolve(false));
      return !!rememberMe;
    } catch (error) {
      console.error('Error getting remember me:', error);
      return false;
    }
  }

  async setRememberMe(enabled: boolean): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.REMEMBER_ME, enabled);
    } catch (error) {
      console.error('Error setting remember me:', error);
    }
  }

  /**
   * Generic getters/setters to support code that expects simple key-based access
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await mmkvStorage.getString(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (error) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw == null) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      } catch (err) {
        console.error('Error getting item:', err);
        return null;
      }
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      await mmkvStorage.set(key, toStore);
    } catch (error) {
      try {
        await AsyncStorage.setItem(key, toStore);
      } catch (err) {
        console.error('Error setting item:', err);
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await mmkvStorage.delete(key);
    } catch (error) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (err) {
        console.error('Error removing item:', err);
      }
    }
  }

  /**
   * User Data Management (using AsyncStorage for complex objects)
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }

  /**
   * Theme Management
   */
  async getTheme(): Promise<'light' | 'dark' | null> {
    try {
      const theme = (await mmkvStorage.getString(STORAGE_KEYS.THEME)) as 'light' | 'dark' | null;
      return theme || null;
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  /**
   * Biometric Settings
   */
  async getBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await (mmkvStorage.getBoolean ? mmkvStorage.getBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED) : Promise.resolve(false));
      return !!enabled;
    } catch (error) {
      console.error('Error getting biometric setting:', error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
    } catch (error) {
      console.error('Error setting biometric:', error);
    }
  }

  /**
   * Push Token Management
   */
  async getPushToken(): Promise<string | null> {
    try {
      const token = await mmkvStorage.getString(STORAGE_KEYS.PUSH_TOKEN);
      return token || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async setPushToken(token: string): Promise<void> {
    try {
      await mmkvStorage.set(STORAGE_KEYS.PUSH_TOKEN, token);
    } catch (error) {
      console.error('Error setting push token:', error);
    }
  }

  /**
   * Cache Management
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache:${key}`);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      if (expiry && Date.now() > expiry) {
        await this.removeCache(key);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheData = {
        data,
        expiry: ttl ? Date.now() + ttl : null,
      };
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  }

  /**
   * Offline Queue Management
   */
  async getOfflineQueue(): Promise<any[]> {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  async addToOfflineQueue(item: any): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({ ...item, timestamp: Date.now() });
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }

  /**
   * Clear All Auth Data
   */
  async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  /**
   * Clear Session Data
   */
  async clearSession(): Promise<void> {
    try {
      await this.removeToken();
      await this.removeSessionId();
      await this.removeSessionExpiry();
      await this.removeUser();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Clear All Storage
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      if (mmkvStorage.clearAll) await mmkvStorage.clearAll();
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  }
}

export const storageService = new StorageService();
