import React from 'react';
import { EnhancedVocabularyStats } from './EnhancedVocabularyStats';

// Keep the original interface for backward compatibility
interface VocabularyStatsProps {
  stats?: any;
}

// This component now acts as a wrapper to the enhanced version
export const VocabularyStats: React.FC<VocabularyStatsProps> = ({ stats }) => {
  return <EnhancedVocabularyStats />;
};
