
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add mapping for language codes to flag codes for react-flag-kit
export const languageToFlagCode: Record<string, string> = {
  "english": "US",
  "german": "DE",
  "spanish": "ES",
  "french": "FR",
  "italian": "IT",
  "portuguese": "PT",
  "dutch": "NL",
  "turkish": "TR",
  "swedish": "SE",
  // Add more languages as needed
}
