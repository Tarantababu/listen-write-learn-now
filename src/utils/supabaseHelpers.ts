import { v4 as uuidv4 } from 'uuid';

// Add helper functions for proper type casting with Supabase
export function asInsertObject<T extends keyof any>(data: any): any {
  return data;
}

export function asUpdateObject<T extends keyof any>(data: any): any {
  return data;
}

export function asUUID(value: string): string {
    if (!value) return uuidv4();
    return value;
}

export function asString(value: string | undefined): string {
    return value || "";
}

export function asBoolean(value: boolean | undefined): boolean {
    return value === true;
}

export function asNumber(value: number | undefined): number {
    return value || 0;
}
