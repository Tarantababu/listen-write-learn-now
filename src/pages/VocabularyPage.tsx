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
  // Add any other properties that might exist on your vocabulary items
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

  // Progress calculations for better UX
  const progressPercentage = Math.min(vocabulary.length / vocabularyLimit * 100, 100);
  const isNearLimit = vocabulary.length >= vocabularyLimit * 0.8;
  const isAtLimit = vocabulary.length >= vocabularyLimit;

  // Stats for better UX
  const vocabularyStats = useMemo(() => {
    return {
      total: languageVocabulary.length,
      filtered: filteredVocabulary.length
    };
  }, [languageVocabulary, filteredVocabulary]);

  // Audio functionality - always plays example audio
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

  // Enhanced interaction handlers
  const handleDeleteVocabularyItem = (id: string) => {
    if (showDeleteConfirm === id) {
      removeVocabularyItem(id);
      setShowDeleteConfirm(null);
      // Adjust current card index if needed in study mode
      if (viewMode === 'study' && currentCardIndex >= filteredVocabulary.length - 1) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
      }
    } else {
      setShowDeleteConfirm(id);
      // Auto-cancel confirmation after 3 seconds
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

  // Get status color for progress
  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const count = languageVocabulary.length;
    if (count === 0) return "Start building your vocabulary library! 📚";
    if (count < 10) return "Great start! Keep adding more words! 🌱";
    if (count < 50) return "You're building a solid foundation! 💪";
    if (count < 100) return "Impressive vocabulary collection! 🎯";
    return "Amazing! You're a vocabulary master! 🏆";
  };

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
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">Vocabulary</h1>
            <Badge variant="secondary" className="text-xs">
              {languageVocabulary.length} words
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {getMotivationalMessage()}
          </p>
        </div>
      </div>

      {/* Enhanced Subscription Status Alert */}
      {!subscription.isSubscribed && (
        <Alert className={`mb-6 border-l-4 ${isAtLimit ? 'bg-red-50 border-red-400' : isNearLimit ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
          <div className="flex items-center gap-2">
            {isAtLimit ? <AlertCircle className="h-4 w-4 text-red-500" /> : isNearLimit ? <AlertCircle className="h-4 w-4 text-yellow-500" /> : <Sparkles className="h-4 w-4 text-blue-500" />}
            
            <AlertDescription className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isAtLimit ? 'Vocabulary limit reached!' : isNearLimit ? 'Approaching vocabulary limit' : 'Free Plan'}
                    </span>
                    <Badge variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'} className="text-xs">
                      {vocabulary.length}/{vocabularyLimit}
                    </Badge>
                  </div>
                  
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`} style={{
                      width: `${progressPercentage}%`
                    }} />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {isAtLimit ? 'Upgrade to add unlimited vocabulary words' : `${vocabularyLimit - vocabulary.length} words remaining`}
                  </p>
                </div>
                
                <Button variant={isAtLimit ? "default" : "outline"} size="sm" className={isAtLimit ? "bg-red-600 hover:bg-red-700" : "border-primary text-primary hover:bg-primary/10"} onClick={() => navigate('/dashboard/subscription')}>
                  <Sparkles className="h-3 w-3 mr-1" /> 
                  {isAtLimit ? 'Upgrade Now' : 'Upgrade'}
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      {languageVocabulary.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search words or definitions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            
            {/* Active Filters Display */}
            {searchTerm && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-xs h-6 px-2">
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column: Enhanced Vocabulary List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Vocabulary List
                </CardTitle>
                <div className="flex items-center gap-2">
                  {filteredVocabulary.length !== languageVocabulary.length && (
                    <Badge variant="outline" className="text-xs">
                      {filteredVocabulary.length} of {languageVocabulary.length}
                    </Badge>
                  )}
                  {/* View Mode Toggle */}
                  {filteredVocabulary.length > 0 && (
                    <div className="flex bg-muted rounded-lg p-1">
                      <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 px-2" title="List view">
                        <List className="h-3 w-3" />
                      </Button>
                      <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="h-7 px-2" title="Card grid view">
                        <Grid3X3 className="h-3 w-3" />
                      </Button>
                      <Button variant={viewMode === 'study' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('study')} className="h-7 px-2" title="Study mode">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {languageVocabulary.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Start building your vocabulary by adding words through the Vocabulary Builder when reading exercises.
                  </p>
                  <Button onClick={() => navigate('/dashboard/reading')} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Reading
                  </Button>
                </div>
              ) : filteredVocabulary.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search terms.
                  </p>
                </div>
              ) : (
                <>
                  {/* List View */}
                  {viewMode === 'list' && (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredVocabulary.map(item => (
                        <div key={item.id} className="group relative">
                          <VocabularyCard item={item} onDelete={() => handleDeleteVocabularyItem(item.id)} />
                          {/* Delete confirmation overlay */}
                          {showDeleteConfirm === item.id && (
                            <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
                              <div className="text-center">
                                <p className="text-sm font-medium text-red-900 mb-2">Delete this word?</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteVocabularyItem(item.id)}>
                                    Yes, Delete
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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
                                
                                {!showDefinition[item.id] && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground text-sm">Click eye to reveal</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center pt-2 border-t">
                                <Badge variant="secondary" className="text-xs">
                                  {item.language}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteVocabularyItem(item.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                  ×
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Delete confirmation overlay for cards */}
                          {showDeleteConfirm === item.id && (
                            <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center z-10">
                              <div className="text-center">
                                <p className="text-sm font-medium text-red-900 mb-2">Delete this word?</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteVocabularyItem(item.id)}>
                                    Delete
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Study Mode */}
                  {viewMode === 'study' && (
                    <div className="space-y-4">
                      {/* Study Mode Controls */}
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Study Mode</span>
                          <Badge variant="outline" className="text-xs">
                            {currentCardIndex + 1} of {filteredVocabulary.length}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => shuffleCards()} className="h-7 px-2" title="Random card">
                            <Shuffle className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentCardIndex(0)} className="h-7 px-2" title="Reset to first">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Study Card */}
                      <div className="relative">
                        <Card className="min-h-[300px] border-2 border-primary/20">
                          <CardContent className="p-4 sm:p-8 h-full flex flex-col justify-center text-center">
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                                  {filteredVocabulary[currentCardIndex]?.word}
                                </h2>
                                <AudioButton itemId={filteredVocabulary[currentCardIndex]?.id} size="lg" className="h-8 w-8 p-0" />
                              </div>
                              
                              <Button variant="outline" onClick={() => toggleDefinition(filteredVocabulary[currentCardIndex]?.id)} className="mx-auto">
                                {showDefinition[filteredVocabulary[currentCardIndex]?.id] ? <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide Definition
                                  </> : <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show Definition
                                  </>}
                              </Button>

                              {showDefinition[filteredVocabulary[currentCardIndex]?.id] && (
                                <div className="space-y-4 animate-in fade-in-50 duration-200">
                                  {filteredVocabulary[currentCardIndex]?.definition && (
                                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                      {filteredVocabulary[currentCardIndex].definition}
                                    </p>
                                  )}
                                  {filteredVocabulary[currentCardIndex]?.example && (
                                    <div className="bg-muted/50 rounded-lg p-4 max-w-xl mx-auto">
                                      <div className="flex items-start gap-3">
                                        <p className="text-sm italic text-muted-foreground flex-1">
                                          "{filteredVocabulary[currentCardIndex].example}"
                                        </p>
                                        <AudioButton itemId={filteredVocabulary[currentCardIndex].id} size="sm" className="h-6 w-6 p-0 flex-shrink-0" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Navigation Arrows */}
                        <Button variant="ghost" size="sm" onClick={() => navigateCard('prev')} className="absolute left-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50" disabled={filteredVocabulary.length <= 1}>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigateCard('next')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50" disabled={filteredVocabulary.length <= 1}>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Study Progress */}
                      <div className="flex justify-center">
                        <div className="flex gap-1">
                          {filteredVocabulary.map((_, index) => <button key={index} onClick={() => setCurrentCardIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentCardIndex ? 'bg-primary' : 'bg-muted'}`} />)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Enhanced Tools and actions */}
        <div className="space-y-4">
          {/* Enhanced Tools Tabs */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vocabulary Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="practice" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="practice" className="flex-1 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    Practice
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex-1 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="practice" className="space-y-3">
                  {languageVocabulary.length > 0 ? <>
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          Ready to practice with {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyPlaylist vocabulary={languageVocabulary} />
                    </> : <div className="text-center py-6">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to start practicing
                      </p>
                    </div>}
                </TabsContent>
                <TabsContent value="export" className="space-y-3">
                  {languageVocabulary.length > 0 ? <>
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Download className="h-4 w-4" />
                          Export {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyExport vocabulary={languageVocabulary} />
                    </> : <div className="text-center py-6">
                      <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to enable export
                      </p>
                    </div>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Enhanced Subscription Upgrade Card */}
          {!subscription.isSubscribed && <div className="mt-4">
              <UpgradePrompt title="Unlimited Vocabulary" message="Premium subscribers can create unlimited vocabulary lists and export all their flashcards with audio." />
            </div>}
        </div>
      </div>
    </div>
  );
};

export default VocabularyPage;