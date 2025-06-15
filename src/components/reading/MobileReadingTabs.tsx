
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, FileText } from 'lucide-react';

interface MobileReadingTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileReadingTabs: React.FC<MobileReadingTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'sentence', label: 'Sentence', icon: BookOpen },
    { id: 'patterns', label: 'Patterns', icon: TrendingUp },
    { id: 'summary', label: 'Summary', icon: FileText }
  ];

  return (
    <div className="flex bg-muted/30 rounded-lg p-1 gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 text-xs touch-manipulation"
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
