import React, { useEffect, useState } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UnitAccordion from '@/components/curriculum/UnitAccordion';
import CurriculumSidebar from '@/components/curriculum/CurriculumSidebar';
import { CheckCircle, Clock, Play, Plus, BookOpen, Target, TrendingUp, Star, Zap, Brain, Award } from 'lucide-react';

// Enhanced Progress Bar Component
const AnimatedProgressBar: React.FC<{ progress: number; className?: string }> = ({ progress, className = "" }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
        style={{ width: `${animatedProgress}%` }}
      >
        <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
      </div>
    </div>
  );
};

// Difficulty Badge Component
const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const configs = {
    beginner: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: Star,
      darkColor: 'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    },
    intermediate: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Zap,
      darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    },
    advanced: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: Brain,
      darkColor: 'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    }
  };
  
  const config = configs[difficulty as keyof typeof configs] || configs.beginner;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${config.darkColor} transition-colors`}>
      <Icon className="w-3 h-3" />
      {difficulty}
    </span>
  );
};

// Enhanced Lesson Card Component
const LessonCard: React.FC<{
  lesson: any;
  onPractice: (id: string) => void;
  onAdd: (id: string) => void;
  index: number;
}> = ({ lesson, onPractice, onAdd, index }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleAction = async (action: 'practice' | 'add', id: string) => {
    setIsAnimating(true);
    if (action === 'practice') {
      await onPractice(id);
    } else {
      await onAdd(id);
    }
    
    // Reset animation after delay to show success state
    setTimeout(() => setIsAnimating(false), 1500);
  };
  
  const getStatusIcon = () => {
    switch (lesson.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-400" />;
    }
  };
  
  return (
    <div 
      className={`group relative backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-slate-700/50 rounded-xl p-4 sm:p-5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 transition-all duration-300 hover:-translate-y-1 ${isAnimating ? 'scale-105 shadow-2xl' : ''}`}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'slideInUp 0.6s ease-out forwards'
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none"></div>
      
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {lesson.title}
            </h4>
            {lesson.difficulty && <DifficultyBadge difficulty={lesson.difficulty} />}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {lesson.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Completed</span>
            </div>
          )}
          
          <button
            onClick={() => handleAction('practice', lesson.id)}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 ${isAnimating ? 'animate-pulse' : ''}`}
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Practice</span>
          </button>
          
          {lesson.status === 'not-started' && (
            <button
              onClick={() => handleAction('add', lesson.id)}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 ${isAnimating ? 'animate-pulse' : ''}`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Success animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-green-500/10 rounded-xl flex items-center justify-center animate-ping">
          <CheckCircle className="w-8 h-8 text-green-500 animate-bounce" />
        </div>
      )}
    </div>
  );
};

// Enhanced Unit Accordion Component
const EnhancedUnitAccordion: React.FC<{
  unitNumber: number;
  title: string;
  lessons: any[];
  onPracticeExercise: (id: string) => void;
  onAddExercise: (id: string) => void;
}> = ({ unitNumber, title, lessons, onPracticeExercise, onAddExercise }) => {
  const [isOpen, setIsOpen] = useState(true);
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progressPercentage = (completedCount / lessons.length) * 100;
  
  return (
    <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg">
              {unitNumber}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                {completedCount} of {lessons.length} lessons completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Complete</div>
            </div>
            <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <AnimatedProgressBar progress={progressPercentage} />
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progress</span>
            <span>{completedCount}/{lessons.length} lessons</span>
          </div>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onPractice={onPracticeExercise}
                onAdd={onAddExercise}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Sidebar Component
const EnhancedCurriculumSidebar: React.FC<{
  totalLessons: number;
  completedLessons: number;
  language: string;
}> = ({ totalLessons, completedLessons, language }) => {
  const progressPercentage = (completedLessons / totalLessons) * 100;
  
  return (
    <div className="space-y-6 lg:sticky lg:top-8">
      {/* Progress Overview Card */}
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Progress</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {Math.round(progressPercentage)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Complete</p>
            </div>
            
            <AnimatedProgressBar progress={progressPercentage} />
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Completed</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {completedLessons}/{totalLessons}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Language Info Card */}
      <div className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/30 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Learning {language}</h3>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            You're making great progress in your {language} journey. Keep up the consistent practice!
          </p>
        </div>
      </div>
    </div>
  );
};

const CurriculumPage: React.FC = () => {
  const { copyDefaultExercise } = useExerciseContext();
  const { 
    exercisesByTag, 
    stats, 
    loading, 
    selectedLanguage,
    refreshData
  } = useCurriculumExercises();
  const navigate = useNavigate();
  
  // Refresh data when the component mounts
  useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);
  
  const handlePracticeExercise = async (id: string) => {
    console.log(`Opening practice for exercise with ID: ${id}`);
    // Navigate to exercises page with the exercise ID as a parameter
    navigate(`/dashboard/exercises?defaultExerciseId=${id}&action=practice`);
  };
  
  const handleAddExercise = async (id: string) => {
    try {
      await copyDefaultExercise(id);
      // After adding, refresh the data to update the exercise status
      refreshData();
      toast.success('Exercise added to your list');
    } catch (error) {
      console.error('Error copying exercise:', error);
      toast.error('Failed to add exercise to your list');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (Object.keys(exercisesByTag).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No Learning Plan Available
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              No learning plan exercises available for {selectedLanguage}.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate total lessons and completed lessons across all units
  const totalLessons = stats.total;
  const completedLessons = stats.completed;
  
  // Filter in-progress exercises
  const inProgressTagMap: Record<string, any[]> = {};
  Object.entries(exercisesByTag).forEach(([tag, exercises]) => {
    const inProgressExercises = exercises.filter(ex => ex.status === 'in-progress');
    if (inProgressExercises.length > 0) {
      inProgressTagMap[tag] = inProgressExercises;
    }
  });
  
  const hasInProgressExercises = Object.keys(inProgressTagMap).length > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-12 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl w-fit mx-auto sm:mx-0">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your {selectedLanguage} Learning Plan
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Follow the structured curriculum to build your {selectedLanguage} skills step by step.
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Tabs */}
        <Tabs defaultValue="learning-plan" className="mb-8">
          <div className="flex justify-center sm:justify-start mb-6">
            <TabsList className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 p-1">
              <TabsTrigger 
                value="learning-plan"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200"
              >
                Learning Plan
              </TabsTrigger>
              <TabsTrigger 
                value="in-progress"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200"
              >
                In Progress
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="learning-plan" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content - Units and Lessons */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Use original UnitAccordion or enhanced version */}
                {Object.entries(exercisesByTag).map(([tag, exercises], index) => (
                  <EnhancedUnitAccordion
                    key={tag}
                    unitNumber={index + 1}
                    title={tag}
                    lessons={exercises}
                    onPracticeExercise={handlePracticeExercise}
                    onAddExercise={handleAddExercise}
                  />
                ))}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <EnhancedCurriculumSidebar
                  totalLessons={totalLessons}
                  completedLessons={completedLessons}
                  language={selectedLanguage}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content - Units and Lessons */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {hasInProgressExercises ? (
                  // Units with in-progress exercises
                  Object.entries(inProgressTagMap).map(([tag, exercises], index) => (
                    <EnhancedUnitAccordion
                      key={tag}
                      unitNumber={index + 1}
                      title={tag}
                      lessons={exercises}
                      onPracticeExercise={handlePracticeExercise}
                      onAddExercise={handleAddExercise}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mb-6">
                      <Clock className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      No lessons in progress
                    </h3>
                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-2">
                      You don't have any in-progress lessons yet.
                    </p>
                    <p className="text-slate-500 dark:text-slate-500">
                      Start a lesson from the Learning Plan to see it here.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1 order-first lg:order-last">
                <EnhancedCurriculumSidebar
                  totalLessons={totalLessons}
                  completedLessons={completedLessons}
                  language={selectedLanguage}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CurriculumPage;