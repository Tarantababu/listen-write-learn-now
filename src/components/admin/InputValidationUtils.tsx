
import { supabase } from '@/integrations/supabase/client';

export interface ValidationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  required?: boolean;
}

export class InputValidator {
  static async validateInput(
    input: string,
    options: ValidationOptions = {}
  ): Promise<{ isValid: boolean; error?: string }> {
    const { maxLength = 1000, allowHtml = false, required = true } = options;

    // Client-side validation first
    if (required && (!input || input.trim().length === 0)) {
      return { isValid: false, error: 'This field is required' };
    }

    if (input && input.length > maxLength) {
      return { isValid: false, error: `Maximum length is ${maxLength} characters` };
    }

    // Basic XSS prevention for client-side
    if (!allowHtml && input) {
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          return { isValid: false, error: 'Invalid characters detected' };
        }
      }
    }

    // Server-side validation using the database function
    try {
      const { data, error } = await supabase.rpc('validate_input', {
        input_text: input,
        max_length: maxLength,
        allow_html: allowHtml
      });

      if (error) {
        console.error('Server validation error:', error);
        return { isValid: false, error: 'Validation failed' };
      }

      if (!data) {
        return { isValid: false, error: 'Input validation failed' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Validation error:', error);
      return { isValid: false, error: 'Validation service unavailable' };
    }
  }

  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// React hook for form validation
import { useState, useCallback } from 'react';

export function useInputValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (
    fieldName: string,
    value: string,
    options: ValidationOptions = {}
  ) => {
    setIsValidating(true);
    
    const result = await InputValidator.validateInput(value, options);
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? '' : (result.error || 'Validation failed')
    }));
    
    setIsValidating(false);
    return result.isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const hasErrors = Object.values(validationErrors).some(error => error !== '');

  return {
    validationErrors,
    isValidating,
    validateField,
    clearErrors,
    hasErrors
  };
}
