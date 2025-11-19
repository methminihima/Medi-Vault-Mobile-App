import { REGEX } from '@config/constants';

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  return REGEX.EMAIL.test(email);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return REGEX.PHONE.test(cleaned);
}

/**
 * Validate NIC (National Identity Card)
 */
export function validateNIC(nic: string): boolean {
  const cleaned = nic.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return REGEX.NIC_OLD.test(cleaned) || REGEX.NIC_NEW.test(cleaned);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date of birth (must be in the past and reasonable age)
 */
export function validateDateOfBirth(date: Date): {
  isValid: boolean;
  error?: string;
} {
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();

  if (date > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  if (age < 0 || age > 150) {
    return { isValid: false, error: 'Please enter a valid date of birth' };
  }

  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(
  value: any,
  fieldName: string = 'Field'
): {
  isValid: boolean;
  error?: string;
} {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): {
  isValid: boolean;
  error?: string;
} {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeInMB: number = 10
): {
  isValid: boolean;
  error?: string;
} {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
  fileName: string,
  allowedTypes: string[]
): {
  isValid: boolean;
  error?: string;
} {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (!extension || !allowedTypes.includes(`.${extension}`)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}
