
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface TabOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  badge?: React.ReactNode;
}

interface StandardTabLayoutProps {
  tabs: TabOption[];
  className?: string;
}

export const StandardTabLayout: React.FC<StandardTabLayoutProps> = ({
  tabs,
  className = ""
}) => {
  const isMobile = useIsMobile();

  return (
    <TabsList className={`
      ${isMobile 
        ? 'grid w-full grid-cols-1 h-auto p-1 mx-4' 
        : `grid w-full grid-cols-${tabs.length}`
      }
      ${className}
    `}>
      {tabs.map((tab) => (
        <TabsTrigger 
          key={tab.value}
          value={tab.value} 
          className={`flex items-center gap-2 relative ${
            isMobile ? 'w-full justify-start px-4 py-3 mb-1 text-base' : ''
          }`}
        >
          {tab.icon}
          <span className={isMobile ? 'text-base' : ''}>
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </span>
          {tab.badge}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
