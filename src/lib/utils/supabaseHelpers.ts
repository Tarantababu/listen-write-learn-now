
/**
 * Helper function to ensure a parameter is properly formatted as a UUID
 * for use with Supabase RPC functions
 */
export function asUUID(id: string | undefined): string {
  // Simple validation to ensure it's a valid string
  if (!id) return '00000000-0000-0000-0000-000000000000';
  return id;
}

/**
 * Helper function to ensure a parameter is properly formatted as a filter parameter
 * for use with Supabase functions
 */
export function asFilterParam(value: string | undefined): string {
  if (!value) return '';
  return value;
}

/**
 * Helper function to ensure a parameter is properly formatted as a boolean
 * for use with Supabase functions
 */
export function asBooleanParam(value: boolean | undefined): boolean {
  return !!value;
}
