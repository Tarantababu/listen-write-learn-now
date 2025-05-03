
import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-full w-full">
          <rect width="16" height="16" x="2" y="2" rx="2" strokeWidth="2" className="fill-none stroke-primary-gray" />
          <path d="M5 6h10M5 10h10M5 14h6" className="stroke-primary-gray" strokeWidth="2" strokeLinecap="round" />
          <path d="M2 18L6 22" className="fill-none stroke-primary-gray" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className={cn("text-xl font-bold text-primary-gray", className)}>lwlnow</h1>
    </div>
  );
}
