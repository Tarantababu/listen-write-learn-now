
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
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
  enableAccessibilityFeatures: boolean;
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
  enablePerformanceMonitoring: false,
  enableAnalytics: false,
  enableAccessibilityFeatures: false,
};

// Development feature flags - all enabled for testing
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
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  enableAccessibilityFeatures: true,
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
  enablePerformanceMonitoring: true,
  enableAnalytics: false,
  enableAccessibilityFeatures: false,
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
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  enableAccessibilityFeatures: false,
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
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  enableAccessibilityFeatures: true,
};

// Phase 4: Advanced Reading Modal - Complete rollout
export const productionPhase4: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true,
  enableWordSynchronization: true,
  enableContextMenu: true,
  enableSelectionFeedback: true,
  enableSmartTextProcessing: true,
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  enableAccessibilityFeatures: true,
};

// Phase 5: Integration & Polish - All features enabled with optimizations
export const productionPhase5: ReadingFeatureFlags = {
  enableTextSelection: true,
  enableVocabularyIntegration: true,
  enableEnhancedHighlighting: true,
  enableAdvancedFeatures: true,
  enableEnhancedModal: true,
  enableWordSynchronization: true,
  enableContextMenu: true,
  enableSelectionFeedback: true,
  enableSmartTextProcessing: true,
  enablePerformanceMonitoring: true,
  enableAnalytics: true,
  enableAccessibilityFeatures: true,
};

// Utility function to get feature flags based on environment
export const getReadingFeatureFlags = (): ReadingFeatureFlags => {
  if (import.meta.env.DEV) {
    return developmentFeatureFlags;
  }
  
  const phase = import.meta.env.VITE_READING_FEATURE_PHASE || 'phase5';
  
  switch (phase) {
    case 'phase1':
      return productionPhase1;
    case 'phase2':
      return productionPhase2;
    case 'phase3':
      return productionPhase3;
    case 'phase4':
      return productionPhase4;
    case 'phase5':
      return productionPhase5;
    case 'development':
      return developmentFeatureFlags;
    default:
      return productionPhase5; // Default to full feature set
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

// Get the current phase name for display purposes
export const getCurrentPhaseName = (): string => {
  const phase = import.meta.env.VITE_READING_FEATURE_PHASE || 'phase5';
  
  const phaseNames = {
    'default': 'Basic Mode',
    'phase1': 'Phase 1: Text Selection',
    'phase2': 'Phase 2: Audio Integration', 
    'phase3': 'Phase 3: Enhanced Selection',
    'phase4': 'Phase 4: Advanced Modal',
    'phase5': 'Phase 5: Complete Experience',
    'development': 'Development Mode'
  };
  
  return phaseNames[phase as keyof typeof phaseNames] || 'Unknown Phase';
};

// Analytics helper for tracking feature usage
export const trackFeatureUsage = (feature: keyof ReadingFeatureFlags, action: string) => {
  if (isFeatureEnabled('enableAnalytics')) {
    console.log(`Feature Usage: ${feature} - ${action}`, {
      timestamp: new Date().toISOString(),
      phase: getCurrentPhaseName(),
      feature,
      action
    });
    // In a real app, this would send to analytics service
  }
};
