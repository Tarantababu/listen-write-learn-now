
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PromoCodeInputProps {
  onCodeApplied: (code: string, discountAmount: number) => void;
  onCodeRemoved: () => void;
  appliedCode?: string;
  discountAmount?: number;
}

export function PromoCodeInput({ 
  onCodeApplied, 
  onCodeRemoved, 
  appliedCode, 
  discountAmount 
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validatePromoCode = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: code.trim() }
      });

      if (error) throw error;

      if (data.valid) {
        onCodeApplied(code.trim(), data.discountAmount);
        setCode('');
      } else {
        setError('Invalid or expired promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setError('Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    onCodeRemoved();
    setCode('');
    setError('');
  };

  if (appliedCode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Promo code "{appliedCode}" applied
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={removePromoCode}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {discountAmount && (
          <p className="text-sm text-green-600">
            Discount: ${(discountAmount / 100).toFixed(2)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isValidating}
          onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
        />
        <Button 
          onClick={validatePromoCode}
          disabled={isValidating || !code.trim()}
          size="sm"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
