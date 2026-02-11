import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserRole } from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Format datetime
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone (Vietnam)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Sleep/delay function
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Decode role values coming from backend/protobuf into human-friendly labels
// Uses UserRole enum from multiservice/auth/v1/auth.proto
export function decodeRole(role?: string | number | null): string {
  if (role === undefined || role === null || role === '') return 'Customer';

  const roleNum = typeof role === 'number' ? role : parseInt(role, 10);

  // Map using actual UserRole enum from protobuf
  switch (roleNum) {
    case UserRole.UNSPECIFIED:
      return 'User';
    case UserRole.CUSTOMER:
      return 'Customer';
    case UserRole.ORG_ADMIN:
      return 'Org Admin';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.MEMBER:
      return 'Member';
    case UserRole.SALE:
      return 'Sales';
    case UserRole.TECH_SOFTWARE:
      return 'Tech (Software)';
    case UserRole.TECH_HARDWARE:
      return 'Tech (Hardware)';
    case UserRole.ADMIN:
      return 'Admin';
    default:
      return 'User';
  }
}
