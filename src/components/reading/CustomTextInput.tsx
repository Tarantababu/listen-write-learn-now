
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle } from 'lucide-react';

interface CustomTextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChange,
  maxLength = 4000
}) => {
  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="custom-text" className="text-base font-medium">
            Your Reading Text
          </Label>
        </div>
        <Badge 
          variant={isOverLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
          className="text-xs"
        >
          {remainingChars} chars remaining
        </Badge>
      </div>

      <div className="space-y-2">
        <Textarea
          id="custom-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type your text here. This will be used to create your reading exercise with AI-generated audio and vocabulary analysis..."
          className={`
            min-h-[200px] resize-none text-base leading-relaxed
            ${isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''}
          `}
          maxLength={maxLength}
        />
        
        {isOverLimit && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Text exceeds maximum length of {maxLength} characters</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> AI will still generate audio and provide vocabulary analysis for your custom text.
            The text should be in your target language for best results.
          </p>
        </div>
      </div>
    </div>
  );
};
