
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
  is_active: boolean;
}

interface PromoCodeValidation {
  isValid: boolean;
  discount: number;
  error?: string;
  promoCode?: PromoCode;
}

export const usePromoCode = () => {
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const validatePromoCode = async (code: string): Promise<PromoCodeValidation> => {
    if (!code.trim()) {
      return { isValid: false, discount: 0, error: 'Please enter a promo code' };
    }

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { isValid: false, discount: 0, error: 'Invalid promo code' };
      }

      const promoCode = data as unknown as PromoCode;

      // Check if expired
      if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
        return { isValid: false, discount: 0, error: 'This promo code has expired' };
      }

      // Check if used up
      if (promoCode.max_uses && promoCode.uses >= promoCode.max_uses) {
        return { isValid: false, discount: 0, error: 'This promo code has reached its usage limit' };
      }

      return {
        isValid: true,
        discount: promoCode.discount_percentage,
        promoCode
      };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return { isValid: false, discount: 0, error: 'Error validating promo code' };
    }
  };

  const applyPromoCode = async (code: string): Promise<boolean> => {
    const validation = await validatePromoCode(code);
    
    if (validation.isValid && validation.promoCode) {
      setAppliedPromoCode(validation.promoCode);
      setValidationError('');
      return true;
    } else {
      setValidationError(validation.error || 'Invalid promo code');
      setAppliedPromoCode(null);
      return false;
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setValidationError('');
  };

  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!appliedPromoCode || originalPrice <= 0) return originalPrice;
    
    const discountAmount = (originalPrice * appliedPromoCode.discount_percentage) / 100;
    const discountedPrice = originalPrice - discountAmount;
    
    // Ensure the discounted price is never negative and has proper precision
    return Math.max(0, Math.round(discountedPrice * 100) / 100);
  };

  const getDiscountAmount = (originalPrice: number): number => {
    if (!appliedPromoCode || originalPrice <= 0) return 0;
    
    const discountAmount = (originalPrice * appliedPromoCode.discount_percentage) / 100;
    return Math.round(discountAmount * 100) / 100;
  };

  const incrementPromoCodeUsage = async (promoCodeId: string): Promise<void> => {
    try {
      // Use the edge function directly instead of RPC
      const { error } = await supabase.functions.invoke('increment-promo-usage', {
        body: { promo_code_id: promoCodeId }
      });
      
      if (error) {
        console.error('Error incrementing promo code usage:', error);
        throw new Error(`Failed to update promo code usage: ${error.message}`);
      }
    } catch (error) {
      console.error('Error incrementing promo code usage:', error);
      throw error;
    }
  };

  return {
    appliedPromoCode,
    validationError,
    validatePromoCode,
    applyPromoCode,
    removePromoCode,
    calculateDiscountedPrice,
    getDiscountAmount,
    incrementPromoCodeUsage
  };
};
