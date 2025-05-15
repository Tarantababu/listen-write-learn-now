
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for Supabase
export function asUUID(id?: string): string {
  return id || '';
}

export function asFilterParam(param?: string): string {
  return param || '';
}

export function asBooleanParam(param?: boolean): boolean {
  return param || false;
}
