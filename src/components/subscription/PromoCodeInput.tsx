
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePromoCode } from '@/hooks/use-promo-code';
import { Check, X, Tag, Loader2 } from 'lucide-react';

interface PromoCodeInputProps {
  onPromoCodeApplied?: (discount: number) => void;
  onPromoCodeRemoved?: () => void;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onPromoCodeApplied,
  onPromoCodeRemoved
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const {
    appliedPromoCode,
    validationError,
    applyPromoCode,
    removePromoCode
  } = usePromoCode();

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;

    setIsValidating(true);
    
    try {
      const success = await applyPromoCode(promoCodeInput);
      
      if (success && appliedPromoCode) {
        onPromoCodeApplied?.(appliedPromoCode.discount_percentage);
        setPromoCodeInput('');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemovePromoCode = () => {
    removePromoCode();
    onPromoCodeRemoved?.();
    setPromoCodeInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyPromoCode();
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="promo-code" className="text-sm font-medium">
        Promo Code
      </Label>
      
      {appliedPromoCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-mono font-medium text-green-700 dark:text-green-400">
              {appliedPromoCode.code}
            </span>
            <Badge variant="secondary" className="text-xs">
              {appliedPromoCode.discount_percentage}% off
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemovePromoCode}
            className="text-green-600 hover:text-green-700 dark:text-green-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="promo-code"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter promo code"
                className="pl-10 font-mono"
                disabled={isValidating}
              />
            </div>
            <Button
              onClick={handleApplyPromoCode}
              disabled={!promoCodeInput.trim() || isValidating}
              variant="outline"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>
          
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <X className="h-3 w-3" />
              {validationError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
