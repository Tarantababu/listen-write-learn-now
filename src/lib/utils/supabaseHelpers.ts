
/**
 * Helper functions for working with Supabase to handle type conversions
 */

/**
 * Converts a string to a UUID type parameter for Supabase
 */
export function asUUID(id: string) {
  return id as any; // Type assertion to bypass TypeScript's strict type checking for Supabase parameters
}

/**
 * Converts an object to an insert object with the correct types for Supabase
 */
export function asInsertObject<T>(obj: T) {
  return obj as any; // Type assertion for insert operations
}

/**
 * Converts an object to an update object with the correct types for Supabase
 */
export function asUpdateObject<T>(obj: T) {
  return obj as any; // Type assertion for update operations
}

/**
 * Safely access data or provide a default value if the data is an error
 */
export function safeDataAccess<T, U>(data: T | { error: true }, accessor: (data: T) => U, defaultValue: U): U {
  if (data && typeof data === 'object' && 'error' in data) {
    return defaultValue;
  }
  return accessor(data as T);
}

/**
 * Convert an array to a properly typed array for Supabase
 */
export function asTypedArray<T>(array: T[]) {
  return array as any; // Type assertion for arrays
}

/**
 * Convert a value to the appropriate filter parameter type for Supabase
 */
export function asFilterParam<T>(value: T) {
  return value as any; // Type assertion for filter parameters
}

/**
 * Convert a boolean to the appropriate filter parameter type for Supabase
 */
export function asBooleanParam(value: boolean) {
  return value as any; // Type assertion for boolean parameters
}
