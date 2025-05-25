import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/lovable-uploads/b9a006c6-dd0a-4ffa-805b-63f0b8b71aff.png" 
        alt="Zebra logo" 
        className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain"
      />
      <span className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">
        <span className="text-brand-primary">lwl</span>now
      </span>
    </div>
  );
}