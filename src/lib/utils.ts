import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSafeDate(date: any): Date {
  if (!date) return new Date();
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate();
  }
  return new Date(date);
}
