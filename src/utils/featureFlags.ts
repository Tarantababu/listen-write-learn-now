
// Feature flag utilities for gradual rollout of enhanced reading features

export interface ReadingFeatureFlags {
  enableTextSelection: boolean;
  enableVocabularyIntegration: boolean;
  enableEnhancedHighlighting: boolean;
  enableAdvancedFeatures: boolean;
  enableEnhancedModal: boolean;
}

// Default feature flags - all disabled for backward compatibility
export const defaultFeatureFlags: ReadingFeatureFlags = {
  enableTextSelection: false,
  enableVocabularyIntegration: false,
  enableEnhancedHighlighting: false,
  enableAdvancedFeatures: false,
  enableEnhancedModal: false,
};

// Development feature flags - can be enabled for testing
export const developmentFeatureFlags: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true, // Enable the new modal in development
};

// Production rollout phases
export const productionPhase1: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: false,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: false,
};

export const productionPhase2: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: false,
};

export const productionPhase3: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true, // Enable new modal in final phase
};

// Utility function to get feature flags based on environment
export const getReadingFeatureFlags = (): ReadingFeatureFlags => {
  // In development, enable all features for testing
  if (import.meta.env.DEV) {
    return developmentFeatureFlags;
  }
  
  // For production, start with default (all disabled) and gradually enable
  // This can be controlled by environment variables or user settings
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
