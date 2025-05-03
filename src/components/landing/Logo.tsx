
import React from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Headphones className="h-6 w-6 text-primary" />
      <h1 className={cn("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent", className)}>lwlnow</h1>
    </div>
  );
}
