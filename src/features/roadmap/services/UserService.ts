
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
   */
  public async getUserLearningStats(language?: Language): Promise<ServiceResult<UserLearningStats>> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to get learning stats');
      }
      
      // Get roadmap progress for all user roadmaps or filtered by language
      const progressQuery = this.supabase
        .from('roadmap_nodes_progress')
        .select('language, is_completed, completion_count')
        .eq('user_id', auth.userId);
        
      if (language) {
        progressQuery.eq('language', language);
      }
      
      const { data: progressData, error: progressError } = await progressQuery;
      
      if (progressError) throw progressError;
      
      // Get exercise completions
      const { data: exerciseData, error: exerciseError } = await this.supabase
        .from('completions')
        .select('accuracy, completed, exercise_id')
        .eq('user_id', auth.userId);
        
      if (exerciseError) throw exerciseError;
      
      // Calculate statistics
      const totalNodes = progressData?.length || 0;
      const completedNodes = progressData?.filter(p => p.is_completed)?.length || 0;
      const totalExercises = exerciseData?.length || 0;
      const completedExercises = exerciseData?.filter(e => e.completed)?.length || 0;
      
      // Calculate average accuracy
      let totalAccuracy = 0;
      let accuracyCount = 0;
      
      exerciseData?.forEach(exercise => {
        if (exercise.accuracy) {
          totalAccuracy += exercise.accuracy;
          accuracyCount++;
        }
      });
      
      const averageAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;
      
      // Initialize the language stats with default values for all languages
      const defaultLanguageStats: LanguageStats = {
        exercisesCompleted: 0,
        accuracy: 0,
        streak: 0
      };
      
      // Create a record with all language keys initialized to default values
      const supportedLanguages: Language[] = [
        'english', 'german', 'spanish', 'french', 'portuguese', 
        'italian', 'turkish', 'swedish', 'dutch', 'norwegian', 
        'russian', 'polish', 'chinese', 'japanese', 'korean', 'arabic'
      ];
      
      const languageStats: Record<Language, LanguageStats> = {} as Record<Language, LanguageStats>;
      
      // Initialize all languages with default stats
      supportedLanguages.forEach(lang => {
        languageStats[lang] = { ...defaultLanguageStats };
      });
      
      // Update stats for languages that have progress data
      progressData?.forEach(progress => {
        const lang = progress.language as Language;
        
        if (lang in languageStats) {
          if (progress.is_completed) {
            // Use the nodesCompleted property that we added to LanguageStats
            if (!languageStats[lang].nodesCompleted) {
              languageStats[lang].nodesCompleted = 1;
            } else {
              languageStats[lang].nodesCompleted++;
            }
          }
          
          // You might want to update the level based on completed nodes
          // This is a simple example - you might have more complex logic
          if (languageStats[lang].nodesCompleted && languageStats[lang].nodesCompleted > 10) {
            languageStats[lang].level = 'A2';
          } else if (languageStats[lang].nodesCompleted && languageStats[lang].nodesCompleted > 20) {
            languageStats[lang].level = 'B1';
          }
        }
      });
      
      // Add exercise stats to language stats
      // In a real implementation, we would join exercises with their language
      // For now, we'll just use the default selected language
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('selected_language')
        .eq('id', auth.userId)
        .single();
        
      const selectedLanguage = profile?.selected_language as Language;
      
      if (selectedLanguage && selectedLanguage in languageStats) {
        languageStats[selectedLanguage].exercisesCompleted = completedExercises;
        // Use the averageAccuracy property that we added to LanguageStats
        languageStats[selectedLanguage].averageAccuracy = averageAccuracy;
      }
      
      // Create result that matches the UserLearningStats interface
      const result: UserLearningStats = {
        exercisesCompleted: completedExercises,
        accuracy: averageAccuracy,
        streak: 0,
        byLanguage: languageStats,
        // Include additional fields for backward compatibility
        totalExercisesCompleted: completedExercises,
        totalNodesCompleted: completedNodes,
        totalRoadmapsCompleted: 0,
        averageAccuracy: averageAccuracy,
        streakDays: 0,
        lastActiveDate: new Date(),
        languageStats: languageStats
      };
      
      return this.success(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get language-specific statistics
   */
  public async getLanguageStats(language: Language): Promise<ServiceResult<LanguageStats>> {
    try {
      const allStats = await this.getUserLearningStats(language);
      
      if (allStats.error) {
        return this.error(allStats.error);
      }
      
      if (allStats.data && allStats.data.byLanguage[language]) {
        return this.success(allStats.data.byLanguage[language]);
      }
      
      return this.success({
        exercisesCompleted: 0,
        accuracy: 0,
        streak: 0
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const userService = new UserService();
