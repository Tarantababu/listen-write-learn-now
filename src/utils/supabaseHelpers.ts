
/**
 * Type assertion helpers for Supabase queries
 */

// Type alias for database ID
type DbId = string;

// For inserting data with proper typing
export function asInsertObject<T>(obj: any): T {
  return obj as unknown as T;
}

// For updating data with proper typing
export function asUpdateObject<T>(obj: any): T {
  return obj as unknown as T;
}

// For UUID parameters
export function asUUID(id: string): any {
  return id;
}

// For string parameters
export function asString(str: string): any {
  return str;
}

// For boolean parameters
export function asBoolean(bool: boolean): any {
  return bool;
}

// For number parameters
export function asNumber(num: number): any {
  return num;
}

// For array parameters
export function asArray<T>(arr: T[]): any {
  return arr;
}

// Helper to safely handle Supabase data results
export function handleSupabaseData<T>(data: any): T | null {
  if (!data) return null;
  return data as T;
}
