import { USER_ROLES } from './constants';

/**
 * Role-based tab configuration
 */
export const TAB_CONFIG = {
  [USER_ROLES.PATIENT]: [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'PatientDashboard' },
    { name: 'Appointments', icon: 'calendar-clock', route: 'Appointments' },
    { name: 'Records', icon: 'file-document', route: 'MedicalRecords' },
    { name: 'Messages', icon: 'message', route: 'Messages' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ],
  [USER_ROLES.DOCTOR]: [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'DoctorDashboard' },
    { name: 'Appointments', icon: 'calendar-clock', route: 'Appointments' },
    { name: 'Patients', icon: 'account-group', route: 'Patients' },
    { name: 'Messages', icon: 'message', route: 'Messages' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ],
  [USER_ROLES.PHARMACIST]: [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'PharmacistDashboard' },
    { name: 'Prescriptions', icon: 'pill', route: 'Prescriptions' },
    { name: 'Inventory', icon: 'package-variant', route: 'Medicines' },
    { name: 'Messages', icon: 'message', route: 'Messages' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ],
  [USER_ROLES.LAB_TECHNICIAN]: [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'LabTechnicianDashboard' },
    { name: 'Lab Tests', icon: 'test-tube', route: 'LabTests' },
    { name: 'Patients', icon: 'account-group', route: 'Patients' },
    { name: 'Messages', icon: 'message', route: 'Messages' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ],
  [USER_ROLES.ADMIN]: [
    { name: 'Dashboard', icon: 'view-dashboard', route: 'AdminDashboard' },
    { name: 'Users', icon: 'account-multiple', route: 'Users' },
    { name: 'Reports', icon: 'chart-box', route: 'Reports' },
    { name: 'Settings', icon: 'cog', route: 'Settings' },
    { name: 'Profile', icon: 'account', route: 'Profile' },
  ],
} as const;

/**
 * Navigation animation configuration
 */
export const NAVIGATION_CONFIG = {
  animation: 'default' as const,
  headerMode: 'screen' as const,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  cardStyleInterpolator: 'forHorizontalIOS' as const,
};

/**
 * Deep linking configuration
 */
export const DEEP_LINK_CONFIG = {
  prefixes: ['medivault://', 'https://medivault.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Appointments: {
            path: 'appointments/:id?',
          },
          MedicalRecords: {
            path: 'records/:id?',
          },
          Prescriptions: {
            path: 'prescriptions/:id?',
          },
          Messages: {
            path: 'messages/:conversationId?',
          },
          Profile: 'profile',
        },
      },
    },
  },
};
