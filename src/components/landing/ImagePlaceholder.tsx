
import React from 'react';
import { Headphones } from 'lucide-react';

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted/50 rounded-lg p-8 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <Headphones className="h-10 w-10 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Image placeholder</span>
      </div>
    </div>
  );
}
