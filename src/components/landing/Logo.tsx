
import React from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Headphones className="h-6 w-6 text-brand-primary" />
      <span className="font-bold text-lg">
        <span className="text-brand-primary">lwl</span>now
      </span>
    </div>
  );
}
