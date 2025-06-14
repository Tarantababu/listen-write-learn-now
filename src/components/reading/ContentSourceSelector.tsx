
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, PenTool } from 'lucide-react';

interface ContentSourceSelectorProps {
  selectedSource: 'ai' | 'custom';
  onSourceSelect: (source: 'ai' | 'custom') => void;
}

const CONTENT_SOURCE_OPTIONS = [
  {
    value: 'ai' as const,
    label: 'AI Generated',
    subtitle: 'Personalized Content',
    description: 'Let AI create content based on your preferences',
    icon: Sparkles,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    value: 'custom' as const,
    label: 'Custom Text',
    subtitle: 'Your Own Content',
    description: 'Use your own text for reading practice',
    icon: PenTool,
    color: 'bg-green-100 text-green-700 border-green-200'
  }
];

export const ContentSourceSelector: React.FC<ContentSourceSelectorProps> = ({
  selectedSource,
  onSourceSelect
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Content Source</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you'd like to create your reading exercise
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTENT_SOURCE_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedSource === option.value;
          
          return (
            <Card
              key={option.value}
              className={`
                cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
                }
              `}
              onClick={() => onSourceSelect(option.value)}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className={`
                    w-12 h-12 mx-auto rounded-full flex items-center justify-center
                    ${isSelected ? 'bg-primary text-primary-foreground' : option.color}
                  `}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h4 className="font-medium">{option.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {option.subtitle}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
