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
  const audioRefs = useRef({});
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioLoading, setAudioLoading] = useState({});

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState({});

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

  // Audio functionality
  const playAudio = async (text, itemId, type = 'example') => {
    if (!text) return;
    const audioKey = `${itemId}-${type}`;

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

      // Create or get existing audio element
      if (!audioRefs.current[audioKey]) {
        const audio = new Audio();
        audioRefs.current[audioKey] = audio;

        // Set up event listeners
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        audio.addEventListener('error', () => {
          setAudioLoading(prev => ({
            ...prev,
            [audioKey]: false
          }));
          setPlayingAudio(null);
          console.error('Audio playback failed');
        });
        audio.addEventListener('loadstart', () => {
          setAudioLoading(prev => ({
            ...prev,
            [audioKey]: true
          }));
        });
        audio.addEventListener('canplay', () => {
          setAudioLoading(prev => ({
            ...prev,
            [audioKey]: false
          }));
        });
      }
      const audio = audioRefs.current[audioKey];

      // Use text-to-speech API or create audio URL
      // For demo purposes, we'll use Web Speech API if available
      if ('speechSynthesis' in window) {
        // Cancel any existing speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.selectedLanguage || 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.onstart = () => {
          setPlayingAudio(audioKey);
          setAudioLoading(prev => ({
            ...prev,
            [audioKey]: false
          }));
        };
        utterance.onend = () => {
          setPlayingAudio(null);
        };
        utterance.onerror = () => {
          setPlayingAudio(null);
          setAudioLoading(prev => ({
            ...prev,
            [audioKey]: false
          }));
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: You would integrate with a TTS service here
        console.log('Speech synthesis not supported');
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
      }
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
      // Stop any playing speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Cleanup audio refs
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
          audio.pause();
        }
      });
    };
  }, []);

  // Enhanced interaction handlers
  const handleDeleteVocabularyItem = id => {
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
  const toggleDefinition = id => {
    setShowDefinition(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const navigateCard = direction => {
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

  // Audio button component for reusability
  const AudioButton = ({
  text,
  itemId,
  type = 'example',
  size = 'sm',
  className = '',
  showLabel = false
}) => {
  const audioKey = `${itemId}-${type}`;
  const isLoading = audioLoading[audioKey];
  const isPlaying = playingAudio === audioKey;
  
  if (!text) return null;
  
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        playAudio(text, itemId, type);
      }}
      className={`${className} ${
        isPlaying 
          ? 'text-primary bg-primary/10 hover:bg-primary/20' 
          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
      } transition-all duration-200`}
      disabled={isLoading}
      title={`Play ${type} audio`}
    >
      {isLoading ? (
        <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
      ) : isPlaying ? (
        <VolumeX className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} animate-pulse`} />
      ) : (
        <Volume2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      )}
      {showLabel && (
        <span className="ml-1 text-xs">
          {isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Play'}
        </span>
      )}
    </Button>
  );
};

// Enhanced Card Grid View with better audio integration
{viewMode === 'cards' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {filteredVocabulary.map(item => (
      <div key={item.id} className="group relative">
        <Card className="h-52 cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-primary/20">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-lg text-primary truncate">{item.word}</h3>
                  <AudioButton 
                    text={item.word} 
                    itemId={item.id} 
                    type="word" 
                    size="sm" 
                    className="h-7 w-7 p-0 flex-shrink-0" 
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDefinition(item.id)}
                  className="h-7 w-7 p-0 flex-shrink-0"
                  title={showDefinition[item.id] ? 'Hide definition' : 'Show definition'}
                >
                  {showDefinition[item.id] ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {showDefinition[item.id] ? (
                <div className="space-y-3 text-sm animate-in fade-in-50 duration-200">
                  {item.definition && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {item.definition}
                    </p>
                  )}
                  {item.example && (
                    <div className="text-xs bg-muted/50 rounded-md p-2">
                      <div className="flex items-start gap-2">
                        <span className="flex-1 italic text-muted-foreground line-clamp-2">
                          "{item.example}"
                        </span>
                        <AudioButton 
                          text={item.example} 
                          itemId={item.id} 
                          type="example" 
                          size="sm" 
                          className="h-5 w-5 p-0 flex-shrink-0 mt-0.5" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <Eye className="h-6 w-6 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground text-xs">Click to reveal definition</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t mt-auto">
              <Badge variant="secondary" className="text-xs">
                {item.language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVocabularyItem(item.id);
                }}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Delete word"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Delete confirmation overlay for cards */}
        {showDeleteConfirm === item.id && (
          <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm border-2 border-red-200 rounded-lg flex items-center justify-center z-10">
            <div className="text-center p-4">
              <p className="text-sm font-medium text-red-900 mb-3">Delete this word?</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVocabularyItem(item.id);
                  }}
                >
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(null);
                  }}
                >
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

// Enhanced Study Mode with improved audio controls
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => shuffleCards()}
          className="h-7 px-2"
          title="Random card"
        >
          <Shuffle className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentCardIndex(0)}
          className="h-7 px-2"
          title="Reset to first"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>

    {/* Study Card */}
    <div className="relative">
      <Card className="min-h-[350px] border-2 border-primary/20">
        <CardContent className="p-4 sm:p-8 h-full flex flex-col justify-center text-center">
          <div className="space-y-6">
            {/* Word with Audio */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                  {filteredVocabulary[currentCardIndex]?.word}
                </h2>
                <AudioButton 
                  text={filteredVocabulary[currentCardIndex]?.word} 
                  itemId={filteredVocabulary[currentCardIndex]?.id} 
                  type="word" 
                  size="lg" 
                  className="h-10 w-10 p-0" 
                />
              </div>
              
              {/* Auto-play toggle for study mode */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const word = filteredVocabulary[currentCardIndex]?.word;
                    const id = filteredVocabulary[currentCardIndex]?.id;
                    if (word && id) {
                      playAudio(word, id, 'word');
                    }
                  }}
                  className="text-xs"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Play Word
                </Button>
              </div>
            </div>
            
            {/* Definition Toggle */}
            <Button
              variant="outline"
              onClick={() => toggleDefinition(filteredVocabulary[currentCardIndex]?.id)}
              className="mx-auto"
            >
              {showDefinition[filteredVocabulary[currentCardIndex]?.id] ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Definition
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Definition
                </>
              )}
            </Button>

            {/* Definition and Example */}
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
                      <AudioButton 
                        text={filteredVocabulary[currentCardIndex].example} 
                        itemId={filteredVocabulary[currentCardIndex].id} 
                        type="example" 
                        size="sm" 
                        className="h-7 w-7 p-0 flex-shrink-0" 
                      />
                    </div>
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const example = filteredVocabulary[currentCardIndex]?.example;
                          const id = filteredVocabulary[currentCardIndex]?.id;
                          if (example && id) {
                            playAudio(example, id, 'example');
                          }
                        }}
                        className="text-xs"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Play Example
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateCard('prev')}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-gray-50 border"
        disabled={filteredVocabulary.length <= 1}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateCard('next')}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-gray-50 border"
        disabled={filteredVocabulary.length <= 1}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>

    {/* Study Progress with Audio Controls */}
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="flex gap-1">
          {filteredVocabulary.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentCardIndex 
                  ? 'bg-primary scale-110' 
                  : 'bg-muted hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Audio Actions */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const currentItem = filteredVocabulary[currentCardIndex];
            if (currentItem?.word) {
              playAudio(currentItem.word, currentItem.id, 'word');
            }
          }}
          className="text-xs"
        >
          <Volume2 className="h-3 w-3 mr-1" />
          Word
        </Button>
        {filteredVocabulary[currentCardIndex]?.example && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentItem = filteredVocabulary[currentCardIndex];
              if (currentItem?.example) {
                playAudio(currentItem.example, currentItem.id, 'example');
              }
            }}
            className="text-xs"
          >
            <Volume2 className="h-3 w-3 mr-1" />
            Example
          </Button>
        )}
      </div>
    </div>
  </div>
)}
        
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
    </div>;
};
export default VocabularyPage;