
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';

export const MinimalistKeyboardHints: React.FC = () => {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-300">
          <Keyboard className="h-4 w-4" />
          Quick Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Check Answer</span>
            <kbd className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 border rounded text-xs font-mono">Enter</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Show Translation</span>
            <kbd className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 border rounded text-xs font-mono">Space</kbd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
