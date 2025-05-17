
import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/src/assets/lwlnow-logo.png" 
        alt="lwlnow logo" 
        className="h-6 w-6" 
      />
      <h1 className={cn("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent", className)}>lwlnow</h1>
    </div>
  );
}
