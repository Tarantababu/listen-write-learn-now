
/// <reference types="vite/client" />

// Helper type for Supabase type casting
type DbId = string;

// Helper types for Supabase query results
type SupabaseData<T> = T | null;
type SupabaseResult<T> = { data: SupabaseData<T>, error: null } | { data: null, error: Error };
