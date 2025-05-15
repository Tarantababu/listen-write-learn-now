
/// <reference types="vite/client" />

// Add Json type definition
declare type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
