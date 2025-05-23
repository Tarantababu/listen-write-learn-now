
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/lovable-uploads/49a4fa5b-8a92-4e9f-8811-e64fc98f3e4c.png" 
        alt="Zebra logo" 
        className="h-8 w-8 object-contain"
      />
      <span className="font-bold text-lg">
        <span className="text-brand-primary">lwl</span>now
      </span>
    </div>
  );
}
