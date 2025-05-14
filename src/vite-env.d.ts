
/// <reference types="vite/client" />

// Helper types for Supabase type casting
type DbId = string;

// More specific type helpers for Supabase queries
type DbBoolean = boolean;
type DbString = string;
type DbNumber = number;
type DbArray<T> = Array<T>;

// Helper types for Supabase query results
type SupabaseData<T> = T | null;
type SupabaseResult<T> = { data: SupabaseData<T>, error: null } | { data: null, error: Error };

// Helper function to safely extract properties from Supabase query results
declare global {
  interface Window {
    handleSupabaseData: <T>(data: any) => T | null;
  }
}
