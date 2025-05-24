import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import VocabularyCard from '@/components/VocabularyCard';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Search, Filter, BookOpen, Download, Trophy, Plus, AlertCircle, CheckCircle, Grid3X3, List, Eye, EyeOff, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VocabularyExport from '@/components/VocabularyExport';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VocabularyItem {
  id: string;
  word: string;
  definition?: string;
  example?: string;
  exampleAudio?: string;
  language: string;
}

const VocabularyPage = () => {
  const {
    vocabulary,
    getVocabularyByLanguage,
    vocabularyLimit,
    removeVocabularyItem
  } = useVocabularyContext();
  const {
    settings
  } = useUserSettingsContext();
  const {
    subscription
  } = useSubscription();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Audio refs and state
  const audioRefs = useRef<{[key: string]: HTMLAudioElement}>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<{[key: string]: boolean}>({});

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'study'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState<{[key: string]: boolean}>({});

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage);

  // Enhanced filtering with search
  const filteredVocabulary = useMemo(() => {
    let filtered = languageVocabulary;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.word?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.definition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [languageVocabulary, searchTerm]);

  // Audio functionality - plays example audio
  const playAudio = async (itemId: string) => {
    const audioKey = `${itemId}-example`;

    // Stop currently playing audio
    if (playingAudio && playingAudio !== audioKey) {
      const currentAudio = audioRefs.current[playingAudio];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Toggle if clicking the same audio
    if (playingAudio === audioKey) {
      const audio = audioRefs.current[audioKey];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudio(null);
      return;
    }

    try {
      setAudioLoading(prev => ({
        ...prev,
        [audioKey]: true
      }));

      const vocabularyItem = filteredVocabulary.find(item => item.id === itemId);
      
      if (!vocabularyItem) {
        throw new Error('Vocabulary item not found');
      }

      // Use the example audio URL
      const audioUrl = vocabularyItem.exampleAudio;
      
      if (!audioUrl) {
        throw new Error('Example audio URL not available');
      }

      // Create new audio element each time to ensure it plays
      const audio = new Audio(audioUrl);
      audioRefs.current[audioKey] = audio;

      // Set up event listeners
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
      });

      audio.addEventListener('error', () => {
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
        setPlayingAudio(null);
        console.error('Audio playback failed');
      });

      audio.addEventListener('canplay', () => {
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
      });

      await audio.play();
      setPlayingAudio(audioKey);

    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioLoading(prev => ({
        ...prev,
        [audioKey]: false
      }));
      setPlayingAudio(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio refs
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.removeEventListener('ended', () => {});
          audio.removeEventListener('error', () => {});
          audio.removeEventListener('canplay', () => {});
        }
      });
    };
  }, []);

  // Rest of your component code remains the same...
  // [Previous code for other handlers and UI rendering]

  // Audio button component
  const AudioButton = ({
    itemId,
    size = 'sm' as const,
    className = ''
  }: {
    itemId: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    className?: string;
  }) => {
    const audioKey = `${itemId}-example`;
    const isLoading = audioLoading[audioKey];
    const isPlaying = playingAudio === audioKey;
    const vocabularyItem = filteredVocabulary.find(item => item.id === itemId);
    const hasAudio = vocabularyItem?.exampleAudio;

    if (!hasAudio) return null;

    return (
      <Button 
        variant="ghost" 
        size={size} 
        onClick={(e) => {
          e.stopPropagation();
          playAudio(itemId);
        }} 
        className={`${className} ${isPlaying ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} 
        disabled={isLoading} 
        title="Play audio"
      >
        {isLoading ? (
          <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
        ) : isPlaying ? (
          <VolumeX className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        ) : (
          <Volume2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        )}
      </Button>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header and other UI elements remain the same... */}

      {/* Card Grid View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVocabulary.map(item => (
            <div key={item.id} className="group relative">
              <Card className="h-48 cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-primary/20">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-primary">{item.word}</h3>
                      <div className="flex items-center gap-1">
                        <AudioButton itemId={item.id} size="sm" className="h-6 w-6 p-0" />
                        <Button variant="ghost" size="sm" onClick={() => toggleDefinition(item.id)} className="h-6 w-6 p-0">
                          {showDefinition[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    {showDefinition[item.id] && (
                      <div className="space-y-2 text-sm">
                        {item.definition && (
                          <p className="text-muted-foreground leading-relaxed">
                            {item.definition}
                          </p>
                        )}
                        {item.example && (
                          <div className="text-xs italic text-muted-foreground border-l-2 border-muted pl-2">
                            <div className="flex items-start gap-2">
                              <span className="flex-1">"{item.example}"</span>
                              <AudioButton itemId={item.id} size="sm" className="h-4 w-4 p-0 mt-0.5 flex-shrink-0" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Study Mode */}
      {viewMode === 'study' && (
        <div className="space-y-4">
          {/* Study Card */}
          <div className="relative">
            <Card className="min-h-[300px] border-2 border-primary/20">
              <CardContent className="p-4 sm:p-8 h-full flex flex-col justify-center text-center">
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                      {filteredVocabulary[currentCardIndex]?.word}
                    </h2>
                    <AudioButton 
                      itemId={filteredVocabulary[currentCardIndex]?.id} 
                      size="lg" 
                      className="h-8 w-8 p-0" 
                    />
                  </div>

                  {filteredVocabulary[currentCardIndex]?.example && (
                    <div className="bg-muted/50 rounded-lg p-4 max-w-xl mx-auto">
                      <div className="flex items-start gap-3">
                        <p className="text-sm italic text-muted-foreground flex-1">
                          "{filteredVocabulary[currentCardIndex].example}"
                        </p>
                        <AudioButton 
                          itemId={filteredVocabulary[currentCardIndex].id} 
                          size="sm" 
                          className="h-6 w-6 p-0 flex-shrink-0" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Rest of your component... */}
    </div>
  );
};

export default VocabularyPage;