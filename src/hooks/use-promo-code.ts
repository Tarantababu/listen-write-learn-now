
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

      const promoCode = data as PromoCode;

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
    if (!appliedPromoCode) return originalPrice;
    
    const discountAmount = (originalPrice * appliedPromoCode.discount_percentage) / 100;
    return Math.max(0, originalPrice - discountAmount);
  };

  const getDiscountAmount = (originalPrice: number): number => {
    if (!appliedPromoCode) return 0;
    
    return (originalPrice * appliedPromoCode.discount_percentage) / 100;
  };

  const incrementPromoCodeUsage = async (promoCodeId: string): Promise<void> => {
    try {
      const { error } = await supabase.rpc('increment_promo_code_usage', {
        promo_code_id: promoCodeId
      });
      
      if (error) {
        console.error('Error incrementing promo code usage:', error);
      }
    } catch (error) {
      console.error('Error incrementing promo code usage:', error);
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
