import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
const VocabularyPage = () => {
  const {
    vocabulary,
    getVocabularyByLanguage,
    vocabularyLimit,
    removeVocabularyItem,
    isLoading: isVocabularyLoading = false
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
  const audioRefs = useRef<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'study'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage);

  // Enhanced filtering with search
  const filteredVocabulary = useMemo(() => {
    let filtered = languageVocabulary;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => item.word?.toLowerCase().includes(searchTerm.toLowerCase()) || item.definition?.toLowerCase().includes(searchTerm.toLowerCase()));
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

  // Audio functionality - plays example audio
  const playAudio = useCallback(async (itemId: string) => {
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

      // Use the audio URL if available
      const audioUrl = vocabularyItem.audioUrl;
      if (!audioUrl) {
        throw new Error('No audio available for this item');
      }

      // Create new audio element each time to ensure it plays
      const audio = new Audio(audioUrl);
      audioRefs.current[audioKey] = audio;

      // Set up event listeners
      const cleanup = () => {
        setPlayingAudio(null);
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
        audio.removeEventListener('ended', cleanup);
        audio.removeEventListener('error', cleanup);
        audio.removeEventListener('canplay', canPlayHandler);
      };
      const canPlayHandler = () => {
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
      };
      audio.addEventListener('ended', cleanup);
      audio.addEventListener('error', cleanup);
      audio.addEventListener('canplay', canPlayHandler);
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
  }, [filteredVocabulary, playingAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio refs
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Keyboard navigation for study mode
  useEffect(() => {
    if (viewMode !== 'study') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateCard('next');
      if (e.key === 'ArrowLeft') navigateCard('prev');
      if (e.key === ' ' || e.key === 'Spacebar') {
        const currentItem = filteredVocabulary[currentCardIndex];
        if (currentItem) {
          toggleDefinition(currentItem.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentCardIndex, filteredVocabulary]);

  // Enhanced interaction handlers
  const handleDeleteVocabularyItem = (id: string) => {
    if (itemToDelete === id) {
      removeVocabularyItem(id);
      setItemToDelete(null);
      // Adjust current card index if needed in study mode
      if (viewMode === 'study' && currentCardIndex >= filteredVocabulary.length - 1) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
      }
      // Remove from selected items if present
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };
  const toggleDefinition = useCallback((id: string) => {
    setShowDefinition(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  const navigateCard = useCallback((direction: 'prev' | 'next') => {
    setCurrentCardIndex(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : filteredVocabulary.length - 1;
      } else {
        return prev < filteredVocabulary.length - 1 ? prev + 1 : 0;
      }
    });
  }, [filteredVocabulary.length]);
  const shuffleCards = useCallback(() => {
    setCurrentCardIndex(Math.floor(Math.random() * filteredVocabulary.length));
  }, [filteredVocabulary.length]);
  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  }, []);
  const handleBulkDelete = useCallback(() => {
    selectedItems.forEach(id => removeVocabularyItem(id));
    setSelectedItems([]);
    setItemToDelete(null);
    // Reset study mode if needed
    if (viewMode === 'study') {
      setCurrentCardIndex(0);
    }
  }, [selectedItems, removeVocabularyItem, viewMode]);

  // Get status color for progress
  const getProgressColor = useCallback(() => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [isAtLimit, isNearLimit]);

  // Get motivational message based on progress
  const getMotivationalMessage = useCallback(() => {
    const count = languageVocabulary.length;
    if (count === 0) return "Start building your vocabulary library! 📚";
    if (count < 10) return "Great start! Keep adding more words! 🌱";
    if (count < 50) return "You're building a solid foundation! 💪";
    if (count < 100) return "Impressive vocabulary collection! 🎯";
    return "Amazing! You're a vocabulary master! 🏆";
  }, [languageVocabulary.length]);

  // Audio button component
  const AudioButton = React.memo(({
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
    const hasAudio = vocabularyItem?.audioUrl;
    if (!hasAudio) return null;
    return <Button variant="ghost" size={size} onClick={e => {
      e.stopPropagation();
      playAudio(itemId);
    }} className={`${className} ${isPlaying ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} disabled={isLoading} title="Play audio" aria-label={isPlaying ? "Stop audio" : "Play audio"}>
        {isLoading ? <div className="relative">
            <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
            <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
          </div> : isPlaying ? <VolumeX className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} /> : <Volume2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />}
      </Button>;
  });
  return <div className="container mx-auto px-4 py-4 sm:py-8">
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
      {!subscription.isSubscribed && <Alert className={`mb-6 border-l-4 ${isAtLimit ? 'bg-red-50 border-red-400' : isNearLimit ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
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
        </Alert>}

      {/* Search and Filter Bar */}
      {languageVocabulary.length > 0 && <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search words or definitions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            
            {/* Active Filters Display */}
            {searchTerm && <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-xs h-6 px-2">
                  Clear
                </Button>
              </div>}
          </CardContent>
        </Card>}
      
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
                  {filteredVocabulary.length !== languageVocabulary.length && <Badge variant="outline" className="text-xs">
                      {filteredVocabulary.length} of {languageVocabulary.length}
                    </Badge>}
                  {/* View Mode Toggle */}
                  {filteredVocabulary.length > 0 && <div className="flex bg-muted rounded-lg p-1">
                      <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 px-2" title="List view">
                        <List className="h-3 w-3" />
                      </Button>
                      <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')} className="h-7 px-2" title="Card grid view">
                        <Grid3X3 className="h-3 w-3" />
                      </Button>
                      <Button variant={viewMode === 'study' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('study')} className="h-7 px-2" title="Study mode">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isVocabularyLoading ? <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div> : languageVocabulary.length === 0 ? <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Start building your vocabulary by adding words through the Vocabulary Builder when reading exercises.
                  </p>
                  
                </div> : filteredVocabulary.length === 0 ? <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search terms.
                  </p>
                </div> : <>
                  {/* Bulk Actions Bar */}
                  {selectedItems.length > 0 && <div className="bg-muted/50 rounded-lg p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {selectedItems.length} selected
                        </span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setItemToDelete('bulk')} className="h-7">
                        Delete Selected
                      </Button>
                    </div>}

                  {/* List View */}
                  {viewMode === 'list' && <div className="space-y-3 sm:space-y-4">
                      {filteredVocabulary.map(item => <div key={item.id} className="group relative">
                          <VocabularyCard item={item} onDelete={() => setItemToDelete(item.id)} isSelected={selectedItems.includes(item.id)} onSelect={() => toggleSelectItem(item.id)} />
                        </div>)}
                    </div>}

                  {/* Card Grid View */}
                  {viewMode === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredVocabulary.map(item => <div key={item.id} className="group relative">
                          <Card className={`h-48 cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${selectedItems.includes(item.id) ? 'border-primary' : 'hover:border-primary/20'}`}>
                            <CardContent className="p-4 h-full flex flex-col justify-between">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-semibold text-lg text-primary">{item.word}</h3>
                                  <div className="flex items-center gap-1">
                                    {item.audioUrl && <AudioButton itemId={item.id} size="sm" className="h-6 w-6 p-0" />}
                                    <Button variant="ghost" size="sm" onClick={() => toggleDefinition(item.id)} className="h-6 w-6 p-0">
                                      {showDefinition[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                                
                                {showDefinition[item.id] && <div className="space-y-2 text-sm">
                                    {item.definition && <p className="text-muted-foreground leading-relaxed">
                                        {item.definition}
                                      </p>}
                                    {item.exampleSentence && <div className="text-xs italic text-muted-foreground border-l-2 border-muted pl-2">
                                        <div className="flex items-start gap-2">
                                          <span className="flex-1">"{item.exampleSentence}"</span>
                                          {item.audioUrl && <AudioButton itemId={item.id} size="sm" className="h-4 w-4 p-0 mt-0.5 flex-shrink-0" />}
                                        </div>
                                      </div>}
                                  </div>}
                                
                                {!showDefinition[item.id] && <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground text-sm">Click eye to reveal</p>
                                  </div>}
                              </div>
                              
                              <div className="flex justify-between items-center pt-2 border-t">
                                <Badge variant="secondary" className="text-xs">
                                  {item.language}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={e => {
                            e.stopPropagation();
                            toggleSelectItem(item.id);
                          }} className={`h-6 w-6 p-0 ${selectedItems.includes(item.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {selectedItems.includes(item.id) ? '✓' : '○'}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={e => {
                            e.stopPropagation();
                            setItemToDelete(item.id);
                          }} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                    ×
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>)}
                    </div>}

                  {/* Study Mode */}
                  {viewMode === 'study' && <div className="space-y-4">
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
                                {filteredVocabulary[currentCardIndex]?.audioUrl && <AudioButton itemId={filteredVocabulary[currentCardIndex]?.id} size="lg" className="h-8 w-8 p-0" />}
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

                              {showDefinition[filteredVocabulary[currentCardIndex]?.id] && <div className="space-y-4 animate-in fade-in-50 duration-200">
                                  {filteredVocabulary[currentCardIndex]?.definition && <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                      {filteredVocabulary[currentCardIndex].definition}
                                    </p>}
                                  {filteredVocabulary[currentCardIndex]?.exampleSentence && <div className="bg-muted/50 rounded-lg p-4 max-w-xl mx-auto">
                                      <div className="flex items-start gap-3">
                                        <p className="text-sm italic text-muted-foreground flex-1">
                                          "{filteredVocabulary[currentCardIndex].exampleSentence}"
                                        </p>
                                        {filteredVocabulary[currentCardIndex]?.audioUrl && <AudioButton itemId={filteredVocabulary[currentCardIndex].id} size="sm" className="h-6 w-6 p-0 flex-shrink-0" />}
                                      </div>
                                    </div>}
                                </div>}
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
                          {filteredVocabulary.map((_, index) => <button key={index} onClick={() => setCurrentCardIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentCardIndex ? 'bg-primary' : 'bg-muted'}`} aria-label={`Go to card ${index + 1}`} />)}
                        </div>
                      </div>
                    </div>}
                </>}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={open => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemToDelete === 'bulk' ? 'Delete Selected Items' : 'Delete Vocabulary Item'}
            </DialogTitle>
            <DialogDescription>
              {itemToDelete === 'bulk' ? `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.` : 'Are you sure you want to delete this vocabulary item? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
            if (itemToDelete === 'bulk') {
              handleBulkDelete();
            } else if (itemToDelete) {
              handleDeleteVocabularyItem(itemToDelete);
            }
          }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default VocabularyPage;