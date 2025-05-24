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

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.word?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.definition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [languageVocabulary, searchTerm]);

  // Progress calculations
  const progressPercentage = Math.min(vocabulary.length / vocabularyLimit * 100, 100);
  const isNearLimit = vocabulary.length >= vocabularyLimit * 0.8;
  const isAtLimit = vocabulary.length >= vocabularyLimit;

  // Audio functionality
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
      
      if (!vocabularyItem || !vocabularyItem.exampleAudio) {
        throw new Error('Audio not available');
      }

      // Create new audio element
      const audio = new Audio(vocabularyItem.exampleAudio);
      audioRefs.current[audioKey] = audio;

      // Event listeners
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
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.removeEventListener('ended', () => {});
          audio.removeEventListener('error', () => {});
        }
      });
    };
  }, []);

  // Interaction handlers
  const handleDeleteVocabularyItem = (id: string) => {
    if (showDeleteConfirm === id) {
      removeVocabularyItem(id);
      setShowDeleteConfirm(null);
      if (viewMode === 'study' && currentCardIndex >= filteredVocabulary.length - 1) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
      }
    } else {
      setShowDeleteConfirm(id);
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  const toggleDefinition = (id: string) => {
    setShowDefinition(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const navigateCard = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentCardIndex(prev => prev > 0 ? prev - 1 : filteredVocabulary.length - 1);
    } else {
      setCurrentCardIndex(prev => prev < filteredVocabulary.length - 1 ? prev + 1 : 0);
    }
  };

  const shuffleCards = () => {
    setCurrentCardIndex(Math.floor(Math.random() * filteredVocabulary.length));
  };

  // Audio button component
  const AudioButton = ({
    itemId,
    size = 'sm',
    className = ''
  }: {
    itemId: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    className?: string;
  }) => {
    const audioKey = `${itemId}-example`;
    const isLoading = audioLoading[audioKey];
    const isPlaying = playingAudio === audioKey;
    const hasAudio = filteredVocabulary.find(item => item.id === itemId)?.exampleAudio;

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
        title="Play example audio"
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
      {/* Header and search section */}
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">Vocabulary</h1>
            <Badge variant="secondary" className="text-xs">
              {languageVocabulary.length} words
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Vocabulary list section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Your Vocabulary</CardTitle>
                {filteredVocabulary.length > 0 && (
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                      <List className="h-3 w-3" />
                    </Button>
                    <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')}>
                      <Grid3X3 className="h-3 w-3" />
                    </Button>
                    <Button variant={viewMode === 'study' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('study')}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {languageVocabulary.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <Button onClick={() => navigate('/dashboard/reading')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Reading
                  </Button>
                </div>
              ) : filteredVocabulary.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                </div>
              ) : (
                <>
                  {/* List View */}
                  {viewMode === 'list' && (
                    <div className="space-y-4">
                      {filteredVocabulary.map(item => (
                        <VocabularyCard 
                          key={item.id} 
                          item={item} 
                          onDelete={() => handleDeleteVocabularyItem(item.id)} 
                        />
                      ))}
                    </div>
                  )}

                  {/* Card Grid View */}
                  {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredVocabulary.map(item => (
                        <Card key={item.id} className="h-48 hover:shadow-md">
                          <CardContent className="p-4 h-full flex flex-col justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg">{item.word}</h3>
                                <div className="flex gap-1">
                                  <AudioButton itemId={item.id} />
                                  <Button variant="ghost" size="sm" onClick={() => toggleDefinition(item.id)}>
                                    {showDefinition[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </div>
                              
                              {showDefinition[item.id] && (
                                <div className="space-y-2 text-sm">
                                  {item.definition && <p>{item.definition}</p>}
                                  {item.example && (
                                    <div className="italic border-l-2 pl-2">
                                      <div className="flex items-start gap-2">
                                        <span>"{item.example}"</span>
                                        <AudioButton itemId={item.id} size="sm" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Study View */}
                  {viewMode === 'study' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <Badge variant="outline">
                          {currentCardIndex + 1} of {filteredVocabulary.length}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={shuffleCards}>
                            <Shuffle className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentCardIndex(0)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="relative">
                        <Card className="min-h-[300px]">
                          <CardContent className="p-6 h-full flex flex-col justify-center text-center">
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold">
                                  {filteredVocabulary[currentCardIndex]?.word}
                                </h2>
                                <AudioButton itemId={filteredVocabulary[currentCardIndex]?.id} size="lg" />
                              </div>

                              {filteredVocabulary[currentCardIndex]?.example && (
                                <div className="bg-muted/50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <p className="text-sm italic flex-1">
                                      "{filteredVocabulary[currentCardIndex].example}"
                                    </p>
                                    <AudioButton itemId={filteredVocabulary[currentCardIndex].id} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigateCard('prev')}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigateCard('next')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tools section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Vocabulary Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="practice">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="practice" className="flex-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    Practice
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="practice">
                  {languageVocabulary.length > 0 ? (
                    <>
                      <VocabularyPlaylist vocabulary={languageVocabulary} />
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to start practicing
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="export">
                  {languageVocabulary.length > 0 ? (
                    <VocabularyExport vocabulary={languageVocabulary} />
                  ) : (
                    <div className="text-center py-6">
                      <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to enable export
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VocabularyPage;