/**
 * API Configuration
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For Android Emulator use 10.0.2.2, for iOS Simulator/Web use localhost
// For physical device, use your computer's LAN IP address (e.g., 192.168.1.100)
const DEFAULT_API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const DEFAULT_WS_URL =
  Platform.OS === 'android'
    ? 'ws://10.0.2.2:5000'
    : 'ws://localhost:5000';

function getDevHostFromExpo(): string | null {
  // In Expo Go / dev, hostUri often contains the LAN IP of your machine, e.g. "192.168.1.5:8081".
  // This lets a physical phone reach your backend at http://<LAN_IP>:5000.
  const hostUri: unknown =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.hostUri;

  if (typeof hostUri !== 'string' || !hostUri) return null;
  const host = hostUri.split(':')[0]?.trim();
  if (!host) return null;
  if (host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2') return null;
  return host;
}

function shouldAutoUseDevHost(baseUrl: string): boolean {
  // If base URL is pointing at localhost / emulator host, a real device can't reach it.
  return /:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:|\/)/i.test(baseUrl);
}

function resolveApiBaseUrl(): string {
  // Expo uses EXPO_PUBLIC_* for env vars in the client bundle.
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  let base = envBase || DEFAULT_API_BASE_URL;

  if (Platform.OS !== 'web' && shouldAutoUseDevHost(base)) {
    const host = getDevHostFromExpo();
    if (host) {
      base = `http://${host}:5000/api`;
    }
  }

  return base;
}

function resolveWsUrl(): string {
  const envWs = process.env.EXPO_PUBLIC_WS_URL || process.env.WS_URL;
  let ws = envWs || DEFAULT_WS_URL;

  if (Platform.OS !== 'web' && shouldAutoUseDevHost(ws)) {
    const host = getDevHostFromExpo();
    if (host) {
      ws = `ws://${host}:5000`;
    }
  }

  return ws;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const WS_URL = resolveWsUrl();
export const ENVIRONMENT = process.env.ENVIRONMENT || 'development';

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@medivault:auth_token',
  SESSION_ID: '@medivault:session_id',
  SESSION_EXPIRY: '@medivault:session_expiry',
  REMEMBER_ME: '@medivault:remember_me',
  USER_DATA: '@medivault:user_data',
  THEME: '@medivault:theme',
  BIOMETRIC_ENABLED: '@medivault:biometric_enabled',
  PUSH_TOKEN: '@medivault:push_token',
  OFFLINE_QUEUE: '@medivault:offline_queue',
} as const;

/**
 * User Roles
 */
export enum USER_ROLES {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  ADMIN = 'admin',
}

/**
 * Appointment Status
 */
export enum APPOINTMENT_STATUS {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

/**
 * Prescription Status
 */
export enum PRESCRIPTION_STATUS {
  ACTIVE = 'active',
  DISPENSED = 'dispensed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Lab Test Status
 */
export enum LAB_TEST_STATUS {
  ORDERED = 'ordered',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Bill Status
 */
export enum BILL_STATUS {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

/**
 * Payment Methods
 */
export enum PAYMENT_METHODS {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
  INSURANCE = 'insurance',
}

/**
 * Notification Types
 */
export enum NOTIFICATION_TYPES {
  APPOINTMENT = 'appointment',
  PRESCRIPTION = 'prescription',
  LAB_TEST = 'lab_test',
  BILL = 'bill',
  MESSAGE = 'message',
  SYSTEM = 'system',
}

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * File Upload
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const;

/**
 * Cache Duration (in milliseconds)
 */
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Date & Time Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'hh:mm a',
  DATETIME: 'MMM dd, yyyy hh:mm a',
} as const;

/**
 * Regex Patterns
 */
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[0-9]{10}$/,
  NIC_OLD: /^[0-9]{9}[vVxX]$/,
  NIC_NEW: /^[0-9]{12}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  APP_NAME: 'MediVault',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@medivault.com',
  SUPPORT_PHONE: '+94112345678',
} as const;
