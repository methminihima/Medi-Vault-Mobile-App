/**
 * Expo Router Entry Point
 * @format
 */

// Import error handler first
import './errorHandler';

// Polyfill for global if needed
if (typeof global === 'undefined') {
  window.global = window;
}

import 'expo-router/entry';
