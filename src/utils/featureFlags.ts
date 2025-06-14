// Feature flag utilities for gradual rollout of enhanced reading features

export interface ReadingFeatureFlags {
  enableTextSelection: boolean;
  enableVocabularyIntegration: boolean;
  enableEnhancedHighlighting: boolean;
  enableAdvancedFeatures: boolean;
  enableEnhancedModal: boolean;
  enableWordSynchronization: boolean;
  enableContextMenu: boolean;
  enableSelectionFeedback: boolean;
  enableSmartTextProcessing: boolean;
}

// Default feature flags - all disabled for backward compatibility
export const defaultFeatureFlags: ReadingFeatureFlags = {
  enableTextSelection: false,
  enableVocabularyIntegration: false,
  enableEnhancedHighlighting: false,
  enableAdvancedFeatures: false,
  enableEnhancedModal: false,
  enableWordSynchronization: false,
  enableContextMenu: false,
  enableSelectionFeedback: false,
  enableSmartTextProcessing: false,
};

// Development feature flags - can be enabled for testing
export const developmentFeatureFlags: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true,
  enableWordSynchronization: true,
  enableContextMenu: true,
  enableSelectionFeedback: true,
  enableSmartTextProcessing: true,
};

// Production rollout phases
export const productionPhase1: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: false,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: false,
  enableWordSynchronization: false,
  enableContextMenu: false,
  enableSelectionFeedback: false,
  enableSmartTextProcessing: false,
};

export const productionPhase2: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true,
  enableWordSynchronization: true,
  enableContextMenu: false,
  enableSelectionFeedback: false,
  enableSmartTextProcessing: false,
};

export const productionPhase3: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true,
  enableWordSynchronization: true,
  enableContextMenu: true,
  enableSelectionFeedback: true,
  enableSmartTextProcessing: true,
};

// Utility function to get feature flags based on environment
export const getReadingFeatureFlags = (): ReadingFeatureFlags => {
  if (import.meta.env.DEV) {
    return developmentFeatureFlags;
  }
  
  const phase = import.meta.env.VITE_READING_FEATURE_PHASE || 'default';
  
  switch (phase) {
    case 'phase1':
      return productionPhase1;
    case 'phase2':
      return productionPhase2;
    case 'phase3':
      return productionPhase3;
    case 'development':
      return developmentFeatureFlags;
    default:
      return defaultFeatureFlags;
  }
};

// User-specific feature flag overrides (can be stored in user preferences)
export const getUserFeatureFlags = (userPreferences?: Partial<ReadingFeatureFlags>): ReadingFeatureFlags => {
  const baseFlags = getReadingFeatureFlags();
  
  return {
    ...baseFlags,
    ...userPreferences,
  };
};

// Check if a specific feature is enabled
export const isFeatureEnabled = (feature: keyof ReadingFeatureFlags, userPreferences?: Partial<ReadingFeatureFlags>): boolean => {
  const flags = getUserFeatureFlags(userPreferences);
  return flags[feature];
};
