
/**
 * Helper functions for working with Supabase
 */

/**
 * Ensures a value is treated as a UUID in Supabase functions
 */
export function asUUID(value: string): string {
  return value;
}

/**
 * Ensures a value is treated as a filter parameter in Supabase functions
 */
export function asFilterParam(value: string): string {
  return value;
}

/**
 * Ensures a value is treated as a boolean parameter in Supabase functions
 */
export function asBooleanParam(value: boolean): boolean {
  return value;
}
