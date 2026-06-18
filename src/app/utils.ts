/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Utility functions for production use
 */

import { I18nService } from './services/i18n.service';

let i18nService: I18nService | null = null;

export function setI18nService(service: I18nService): void {
  i18nService = service;
}

function getLocale(): string {
  // Always use English locale
  return 'en-US';
}

/** Debounce function */
export function debounce<T extends (...args: any[]) => any>(
  func: T, wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** Throttle function */
export function throttle<T extends (...args: any[]) => any>(
  func: T, limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/** Format currency with i18n support */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/** Format number with locale */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}

/** Generate unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Deep clone */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Is empty string/undefined/null */
export function isEmpty(value: any): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Safe trim */
export function safeTrim(value: any): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

/** Parse integer safely */
export function safeInt(value: any, defaultValue = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/** Parse float safely */
export function safeFloat(value: any, defaultValue = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/** Local storage with error handling */
export const Storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  }
};
