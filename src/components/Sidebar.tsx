
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return null; // Return nothing on mobile as it's handled by the mobile menu
  }

  return (
    <div className={cn(
      "hidden h-screen w-64 border-r bg-background lg:block overflow-auto",
      className
    )}>
      {children}
    </div>
  );
}
