
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(string: string): string {
  if (!string || typeof string !== 'string') return '';
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}
