
import type { Database } from '@/integrations/supabase/types';

// Type alias for database ID
export type DbId = string;

/**
 * Helper for inserting data with proper typing for Supabase tables
 * 
 * @param tableName The name of the table to insert into
 * @param obj The object to insert
 * @returns The properly typed object for insertion
 */
export function asInsertObject<T extends keyof Database['public']['Tables']>(
  obj: Record<string, any>
): Database['public']['Tables'][T]['Insert'] {
  return obj as Database['public']['Tables'][T]['Insert'];
}

/**
 * Helper for updating data with proper typing for Supabase tables
 * 
 * @param tableName The name of the table to update
 * @param obj The object containing update values
 * @returns The properly typed object for update
 */
export function asUpdateObject<T extends keyof Database['public']['Tables']>(
  obj: Record<string, any>
): Database['public']['Tables'][T]['Update'] {
  return obj as Database['public']['Tables'][T]['Update'];
}

// For UUID parameters
export function asUUID(id: string): string {
  return id;
}

// For string parameters
export function asString(str: string): string {
  return str;
}

// For boolean parameters
export function asBoolean(bool: boolean): boolean {
  return bool;
}

// For number parameters
export function asNumber(num: number): number {
  return num;
}

// For array parameters
export function asArray<T>(arr: T[]): T[] {
  return arr;
}

// Helper to safely handle Supabase data results
export function handleSupabaseData<T>(data: any): T | null {
  if (!data) return null;
  return data as T;
}
