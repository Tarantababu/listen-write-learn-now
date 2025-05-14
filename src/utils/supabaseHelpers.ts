
import { v4 as uuidv4 } from 'uuid';
import type { PostgrestFilterBuilder } from '@supabase/supabase-js';

// Generic helper for proper type casting with Supabase inserts
export function asInsertObject<T extends keyof any>(data: any): any {
  return data;
}

// Generic helper for proper type casting with Supabase updates
export function asUpdateObject<T extends keyof any>(data: any): any {
  return data;
}

// Helper for UUID parameters
export function asUUID(value: string | undefined): string {
  if (!value) return uuidv4();
  return value;
}

// Helper for string parameters
export function asString(value: string | undefined): string {
  return value || "";
}

// Helper for boolean parameters
export function asBoolean(value: boolean | undefined): boolean {
  return value === true;
}

// Helper for number parameters
export function asNumber(value: number | undefined): number {
  return value || 0;
}

// Helper for handling filter conditions safely
export function eqFilter<T extends Record<string, any>, K extends keyof T>(
  query: PostgrestFilterBuilder<T>,
  column: K,
  value: T[K]
): PostgrestFilterBuilder<T> {
  return query.eq(column as any, value as any);
}

// Helper to ensure consistent handling of null checks
export function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined;
}
