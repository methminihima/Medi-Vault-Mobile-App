import { Platform } from 'react-native';
import { PERMISSIONS, Permission } from 'react-native-permissions';

/**
 * iOS Permissions
 */
const IOS_PERMISSIONS = {
  CAMERA: PERMISSIONS.IOS.CAMERA,
  PHOTO_LIBRARY: PERMISSIONS.IOS.PHOTO_LIBRARY,
  LOCATION: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  NOTIFICATIONS: PERMISSIONS.IOS.NOTIFICATIONS,
  FACE_ID: PERMISSIONS.IOS.FACE_ID,
  MEDIA_LIBRARY: PERMISSIONS.IOS.MEDIA_LIBRARY,
} as const;

/**
 * Android Permissions
 */
const ANDROID_PERMISSIONS = {
  CAMERA: PERMISSIONS.ANDROID.CAMERA,
  READ_EXTERNAL_STORAGE: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  WRITE_EXTERNAL_STORAGE: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  ACCESS_FINE_LOCATION: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  ACCESS_COARSE_LOCATION: PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  POST_NOTIFICATIONS: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
} as const;

/**
 * Permission configuration
 */
export const PERMISSION_CONFIG = {
  camera: {
    ios: IOS_PERMISSIONS.CAMERA,
    android: ANDROID_PERMISSIONS.CAMERA,
    title: 'Camera Permission',
    message: 'MediVault needs access to your camera to scan QR codes and capture documents',
  },
  photoLibrary: {
    ios: IOS_PERMISSIONS.PHOTO_LIBRARY,
    android: ANDROID_PERMISSIONS.READ_EXTERNAL_STORAGE,
    title: 'Photo Library Permission',
    message: 'MediVault needs access to your photo library to upload documents',
  },
  location: {
    ios: IOS_PERMISSIONS.LOCATION,
    android: ANDROID_PERMISSIONS.ACCESS_FINE_LOCATION,
    title: 'Location Permission',
    message: 'MediVault needs access to your location to find nearby hospitals and pharmacies',
  },
  notifications: {
    ios: IOS_PERMISSIONS.NOTIFICATIONS,
    android: ANDROID_PERMISSIONS.POST_NOTIFICATIONS,
    title: 'Notification Permission',
    message:
      'MediVault needs permission to send you important notifications about appointments and prescriptions',
  },
  biometric: {
    ios: IOS_PERMISSIONS.FACE_ID,
    android: undefined,
    title: 'Biometric Permission',
    message: 'MediVault uses Face ID/Touch ID for secure and convenient login',
  },
} as const;

/**
 * Get permission for current platform
 */
export function getPermission(
  permissionType: keyof typeof PERMISSION_CONFIG
): Permission | undefined {
  const config = PERMISSION_CONFIG[permissionType];
  return Platform.OS === 'ios' ? config.ios : config.android;
}

/**
 * Get permission message
 */
export function getPermissionMessage(permissionType: keyof typeof PERMISSION_CONFIG): {
  title: string;
  message: string;
} {
  const config = PERMISSION_CONFIG[permissionType];
  return {
    title: config.title,
    message: config.message,
  };
}
