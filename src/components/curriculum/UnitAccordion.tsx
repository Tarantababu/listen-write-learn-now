
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Trophy, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LessonItem from './LessonItem';

interface Exercise {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface UnitAccordionProps {
  unitNumber: number;
  title: string;
  lessons: Exercise[];
  onPracticeExercise: (id: string) => void;
  onAddExercise: (id: string) => void;
  defaultOpen?: boolean;
}

const UnitAccordion: React.FC<UnitAccordionProps> = ({ 
  unitNumber, 
  title, 
  lessons, 
  onPracticeExercise, 
  onAddExercise,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Calculate lesson statistics
  const completedLessons = lessons.filter(lesson => lesson.status === 'completed').length;
  const inProgressLessons = lessons.filter(lesson => lesson.status === 'in-progress').length;
  const notStartedLessons = lessons.filter(lesson => lesson.status === 'not-started').length;
  const totalLessons = lessons.length;

  // Determine unit status based on lessons
  const getUnitStatus = () => {
    if (completedLessons === totalLessons) return 'completed';
    if (inProgressLessons > 0 || completedLessons > 0) return 'in-progress';
    return 'not-started';
  };

  const unitStatus = getUnitStatus();
  const progressPercentage = (completedLessons / totalLessons) * 100;

  // Status colors and icons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'in-progress': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Trophy className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-6 text-left hover:bg-gray-50/50 transition-colors rounded-t-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Unit number badge */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm
                ${getStatusColor(unitStatus)}
              `}>
                {unitStatus === 'completed' ? (
                  <Trophy className="h-5 w-5" />
                ) : (
                  unitNumber
                )}
              </div>

              {/* Unit info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    Unit {unitNumber}: {title}
                  </h3>
                  <div className={`
                    inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border
                    ${getStatusColor(unitStatus)}
                  `}>
                    {getStatusIcon(unitStatus)}
                    <span className="capitalize">{unitStatus.replace('-', ' ')}</span>
                  </div>
                </div>

                {/* Progress bar and stats */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 max-w-xs">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {completedLessons}/{totalLessons} lessons
                  </span>
                </div>
              </div>
            </div>

            {/* Expand/collapse icon */}
            <div className="ml-4">
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500 transition-transform" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 transition-transform" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-gray-100">
          <div className="p-6 pt-4 space-y-3">
            {/* Lesson stats summary */}
            {totalLessons > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{completedLessons}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{inProgressLessons}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{notStartedLessons}</div>
                  <div className="text-xs text-gray-600">Not Started</div>
                </div>
              </div>
            )}

            {/* Lessons */}
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  lessonNumber={index + 1}
                  onPractice={() => onPracticeExercise(lesson.id)}
                  onAdd={() => onAddExercise(lesson.id)}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default UnitAccordion;
