export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  nic: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'lab_technician';
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  qualifications?: string;
  // Pharmacist-specific fields
  pharmacyLicense?: string;
  // Lab Technician-specific fields
  labLicense?: string;
}

export interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris';
}

export interface SessionData {
  token: string;
  expiresAt: string;
  refreshToken?: string;
}
