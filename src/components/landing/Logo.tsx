
import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, size = 'default' }: { className?: string, size?: 'sm' | 'default' | 'lg' }) {
  // Calculate logo size based on the size prop
  const logoSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
  const strokeWidth = size === 'sm' ? 2 : 2.5;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-shrink-0", {
        'h-6 w-6': size === 'sm',
        'h-8 w-8': size === 'default',
        'h-10 w-10': size === 'lg'
      })}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className="h-full w-full"
          width={logoSize}
          height={logoSize}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect 
            width="16" 
            height="16" 
            x="2" 
            y="2" 
            rx="2" 
            strokeWidth={strokeWidth} 
            className="fill-none stroke-primary-gray" 
          />
          <path 
            d="M5 6h10M5 10h10M5 14h6" 
            className="stroke-primary-gray" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
          />
          <path 
            d="M2 18L6 22" 
            className="fill-none stroke-primary-gray" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
          />
        </svg>
      </div>
      <h1 className={cn(
        "font-bold text-primary-gray", 
        {
          'text-base': size === 'sm',
          'text-xl': size === 'default',
          'text-2xl': size === 'lg'
        },
        className
      )}>lwlnow</h1>
    </div>
  );
}
