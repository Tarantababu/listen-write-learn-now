
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Clock, Target } from 'lucide-react';
import { AnticipationLesson } from '@/types/anticipation';
import { AnticipationService } from '@/services/anticipationService';
import { AnticipationLessonPlayer } from '@/components/anticipation/AnticipationLessonPlayer';
import { CreateAnticipationLessonModal } from '@/components/anticipation/CreateAnticipationLessonModal';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

export const AnticipationPage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [lessons, setLessons] = useState<AnticipationLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<AnticipationLesson | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLessons();
    }
  }, [user, settings.selectedLanguage]);

  const loadLessons = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const lessonsData = await AnticipationService.getUserLessons(
        user.id,
        settings.selectedLanguage
      );
      setLessons(lessonsData);
    } catch (error) {
      console.error('Failed to load lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonCreated = (newLesson: AnticipationLesson) => {
    setLessons(prev => [newLesson, ...prev]);
    setShowCreateModal(false);
    toast.success('Lesson created successfully!');
  };

  const handleStartLesson = (lesson: AnticipationLesson) => {
    setSelectedLesson(lesson);
  };

  const handleCloseLesson = () => {
    setSelectedLesson(null);
    loadLessons(); // Refresh to get updated progress
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedLesson) {
    return (
      <AnticipationLessonPlayer
        lesson={selectedLesson}
        onClose={handleCloseLesson}
      />
    );
  }

  return (
    <>
      <SEO 
        title="Principle of Anticipation - Interactive Language Learning"
        description="Learn languages naturally through anticipation-based lessons with cultural insights and interactive practice"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Principle of Anticipation
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Learn through anticipation. Predict target language responses before hearing them, 
                then check your understanding with cultural insights and interactive practice.
              </p>
            </div>

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">Your Lessons</h2>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Lesson
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first anticipation lesson to start learning through prediction and cultural context.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Lesson
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {lesson.difficulty_level}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(lesson.created_at)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Theme:</strong> {lesson.conversation_theme}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Language:</strong> {lesson.language.charAt(0).toUpperCase() + lesson.language.slice(1)}
                        </p>
                        <Button 
                          onClick={() => handleStartLesson(lesson)}
                          className="w-full"
                          variant="default"
                        >
                          Start Lesson
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreateAnticipationLessonModal
            onClose={() => setShowCreateModal(false)}
            onLessonCreated={handleLessonCreated}
          />
        )}
      </div>
    </>
  );
};
