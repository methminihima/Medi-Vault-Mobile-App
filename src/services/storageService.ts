import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_KEYS } from '@config/constants';
import { User } from '@types/models';

/**
 * MMKV storage instance for fast key-value storage
 */
const mmkvStorage = new MMKV();

/**
 * Storage Service - Handles all persistent storage operations
 */
class StorageService {
  /**
   * Token Management (using MMKV for speed)
   */
  async getToken(): Promise<string | null> {
    try {
      return mmkvStorage.getString(STORAGE_KEYS.AUTH_TOKEN) || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      mmkvStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      mmkvStorage.delete(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
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
      return (mmkvStorage.getString(STORAGE_KEYS.THEME) as 'light' | 'dark') || null;
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      mmkvStorage.set(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  /**
   * Biometric Settings
   */
  async getBiometricEnabled(): Promise<boolean> {
    try {
      return mmkvStorage.getBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED) || false;
    } catch (error) {
      console.error('Error getting biometric setting:', error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      mmkvStorage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
    } catch (error) {
      console.error('Error setting biometric:', error);
    }
  }

  /**
   * Push Token Management
   */
  async getPushToken(): Promise<string | null> {
    try {
      return mmkvStorage.getString(STORAGE_KEYS.PUSH_TOKEN) || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async setPushToken(token: string): Promise<void> {
    try {
      mmkvStorage.set(STORAGE_KEYS.PUSH_TOKEN, token);
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
   * Clear All Storage
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      mmkvStorage.clearAll();
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  }
}

export const storageService = new StorageService();
