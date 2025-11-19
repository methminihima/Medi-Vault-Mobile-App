import { format, formatDistance, formatRelative, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS } from '@config/constants';

/**
 * Format date to display format
 */
export function formatDate(date: string | Date, formatStr: string = DATE_FORMATS.DISPLAY): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format date to API format (yyyy-MM-dd)
 */
export function formatDateForAPI(date: Date): string {
  return format(date, DATE_FORMATS.API);
}

/**
 * Format time to display format
 */
export function formatTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid time';
    return format(dateObj, DATE_FORMATS.TIME);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format datetime to display format
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, DATE_FORMATS.DATETIME);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid date';
  }
}

/**
 * Format date with relative time (e.g., "last Friday at 3:00 PM")
 */
export function formatRelativeDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatRelative(dateObj, new Date());
  } catch (error) {
    console.error('Error formatting relative datetime:', error);
    return 'Invalid date';
  }
}

/**
 * Get age from date of birth
 */
export function getAge(dateOfBirth: string | Date): number {
  try {
    const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    if (!isValid(dob)) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    return dateObj < new Date();
  } catch (error) {
    console.error('Error checking if past:', error);
    return false;
  }
}

/**
 * Check if date is in the future
 */
export function isFuture(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    return dateObj > new Date();
  } catch (error) {
    console.error('Error checking if future:', error);
    return false;
  }
}
