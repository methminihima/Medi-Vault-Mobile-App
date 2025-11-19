/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  try {
    if (currency === 'LKR') {
      return `Rs. ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${amount}`;
  }
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format: 077-123-4567
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format with country code: +94 77-123-4567
  if (cleaned.length === 11 && cleaned.startsWith('94')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(
      7
    )}`;
  }

  return phone;
}

/**
 * Format NIC (National Identity Card)
 */
export function formatNIC(nic: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = nic.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Old format: 123456789V or 123456789X
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 9)}-${cleaned.slice(9)}`;
  }

  // New format: 200012345678
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }

  return nic;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalize each word
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
}

/**
 * Format name (capitalize each word, handle middle names)
 */
export function formatName(name: string): string {
  return capitalizeWords(name.trim());
}

/**
 * Mask sensitive data (e.g., email, phone)
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 3) return email;
  return `${username.slice(0, 3)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `***-***-${phone.slice(-4)}`;
}

export function maskNIC(nic: string): string {
  if (nic.length <= 4) return nic;
  return `***-***-${nic.slice(-4)}`;
}
