
import { Language, LanguageLevel } from '@/types';
import { BaseService } from './BaseService';
import { 
  UserServiceInterface,
  ServiceResult,
  UserPreferences,
  UserLearningStats,
  LanguageStats
} from '../types/service-types';

export class UserService extends BaseService implements UserServiceInterface {
  /**
   * Get user preferences
   */
  public async getUserPreferences(): Promise<ServiceResult<UserPreferences>> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to get preferences');
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.userId)
        .single();
        
      if (profileError) throw profileError;
      
      // Return formatted preferences
      return this.success({
        selectedLanguage: profile.selected_language as Language,
        learningLanguages: profile.learning_languages as Language[],
        theme: 'system' // Default
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Update user preferences
   */
  public async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ServiceResult<UserPreferences>> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to update preferences');
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (preferences.selectedLanguage) {
        updateData.selected_language = preferences.selectedLanguage;
      }
      
      if (preferences.learningLanguages) {
        updateData.learning_languages = preferences.learningLanguages;
      }
      
      // Update profile
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', auth.userId);
        
      if (updateError) throw updateError;
      
      // Get updated profile
      const { data: updatedProfile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.userId)
        .single();
        
      if (profileError) throw profileError;
      
      // Return updated preferences
      return this.success({
        selectedLanguage: updatedProfile.selected_language as Language,
        learningLanguages: updatedProfile.learning_languages as Language[],
        theme: preferences.theme || 'system'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get user learning statistics
   * This is a stubbed implementation for the deprecated roadmap feature
   */
  public async getUserLearningStats(language?: Language): Promise<ServiceResult<UserLearningStats>> {
    // Return mock user learning stats as the roadmap feature is deprecated
    console.log('Stub UserService.getUserLearningStats called with language:', language);
    
    // Create a mock record with all language keys initialized to default values
    const supportedLanguages: Language[] = [
      'english', 'german', 'spanish', 'french', 'portuguese', 
      'italian', 'turkish', 'swedish', 'dutch', 'norwegian', 
      'russian', 'polish', 'chinese', 'japanese', 'korean', 'arabic'
    ];
    
    const languageStats: Record<Language, LanguageStats> = {} as Record<Language, LanguageStats>;
    
    // Initialize all languages with default stats
    supportedLanguages.forEach(lang => {
      languageStats[lang] = { 
        exercisesCompleted: 0,
        accuracy: 0,
        streak: 0
      };
    });
    
    // Create mock result that matches the UserLearningStats interface
    const result: UserLearningStats = {
      exercisesCompleted: 0,
      accuracy: 0,
      streak: 0,
      byLanguage: languageStats,
      // Include additional fields for backward compatibility
      totalExercisesCompleted: 0,
      totalNodesCompleted: 0,
      totalRoadmapsCompleted: 0,
      averageAccuracy: 0,
      streakDays: 0,
      lastActiveDate: new Date(),
      languageStats: languageStats
    };
    
    return this.success(result);
  }

  /**
   * Get language-specific statistics
   * This is a stubbed implementation for the deprecated roadmap feature
   */
  public async getLanguageStats(language: Language): Promise<ServiceResult<LanguageStats>> {
    console.log('Stub UserService.getLanguageStats called with language:', language);
    
    return this.success({
      exercisesCompleted: 0,
      accuracy: 0,
      streak: 0
    });
  }
}

// Create and export singleton instance
export const userService = new UserService();
