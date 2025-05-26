import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVocabularyContext } from "@/contexts/VocabularyContext";
import { useUserSettingsContext } from "@/contexts/UserSettingsContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Search, BookOpen, Download, Trophy, AlertCircle, CheckCircle, List, Eye, EyeOff, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, VolumeX, Loader2, Play, Pause, SkipForward, SkipBack, Repeat, Plus, HelpCircle, X, Music, ListMusic, Zap, CheckSquare, PlayCircle } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import UpgradePrompt from "@/components/UpgradePrompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VocabularyExport from "@/components/VocabularyExport";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
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

  // Enhanced Audio refs and state
  const audioRefs = useRef<{
    [key: string]: HTMLAudioElement;
  }>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [audioProgress, setAudioProgress] = useState<{
    [key: string]: number;
  }>({});
  const [audioDuration, setAudioDuration] = useState<{
    [key: string]: number;
  }>({});
  const [audioError, setAudioError] = useState<{
    [key: string]: string;
  }>({});
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [audioQueue, setAudioQueue] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vocabulary-audio-queue");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [originalQueue, setOriginalQueue] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vocabulary-original-queue");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentQueueIndex, setCurrentQueueIndex] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vocabulary-queue-index");
        return saved ? Number.parseInt(saved) : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [_isShuffleMode, _setIsShuffleMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vocabulary-shuffle-mode") === "true";
    }
    return false;
  });
  const [_isRepeatMode, _setIsRepeatMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vocabulary-repeat-mode") === "true";
    }
    return false;
  });

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "study">("list");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Playlist guide state
  const [showPlaylistGuide, setShowPlaylistGuide] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vocabulary-guide-seen") === "true";
    }
    return false;
  });

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
      filtered: filteredVocabulary.length,
      withAudio: languageVocabulary.filter(item => item.audioUrl).length
    };
  }, [languageVocabulary, filteredVocabulary]);

  // Check if there are words with audio available
  const wordsWithAudio = useMemo(() => {
    return languageVocabulary.filter(item => item.audioUrl);
  }, [languageVocabulary]);

  // Persist playlist state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vocabulary-audio-queue", JSON.stringify(audioQueue));
    }
  }, [audioQueue]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vocabulary-original-queue", JSON.stringify(originalQueue));
    }
  }, [originalQueue]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vocabulary-queue-index", currentQueueIndex.toString());
    }
  }, [currentQueueIndex]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vocabulary-shuffle-mode", _isShuffleMode.toString());
    }
  }, [_isShuffleMode]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vocabulary-repeat-mode", _isRepeatMode.toString());
    }
  }, [_isRepeatMode]);

  // Filter audio queue when language changes
  useEffect(() => {
    if (audioQueue.length > 0) {
      const currentLanguageWordIds = languageVocabulary.map(item => item.id);
      const filteredQueue = audioQueue.filter(id => currentLanguageWordIds.includes(id));
      const filteredOriginalQueue = originalQueue.filter(id => currentLanguageWordIds.includes(id));

      // Only update if the queue actually changed
      if (filteredQueue.length !== audioQueue.length) {
        setAudioQueue(filteredQueue);
        setOriginalQueue(filteredOriginalQueue);

        // Reset current index if it's out of bounds
        if (currentQueueIndex >= filteredQueue.length) {
          setCurrentQueueIndex(0);
          localStorage.setItem("vocabulary-queue-index", "0");
        }

        // Update localStorage
        localStorage.setItem("vocabulary-audio-queue", JSON.stringify(filteredQueue));
        localStorage.setItem("vocabulary-original-queue", JSON.stringify(filteredOriginalQueue));

        // Stop current audio if it's not in the current language
        if (playingAudio) {
          const playingItemId = playingAudio.replace("-example", "");
          if (!currentLanguageWordIds.includes(playingItemId)) {
            const audio = audioRefs.current[playingAudio];
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
            }
            setPlayingAudio(null);
          }
        }
      }
    }
  }, [settings.selectedLanguage, languageVocabulary]);

  // Enhanced Audio functionality with queue management
  const playAudio = useCallback(async (itemId: string, addToQueue = false) => {
    const audioKey = `${itemId}-example`;

    // Safety check: ensure the item belongs to current language
    const vocabularyItem = languageVocabulary.find(item => item.id === itemId);
    if (!vocabularyItem) {
      console.warn("Attempted to play audio for item not in current language:", itemId);
      return;
    }

    // Handle queue management
    if (addToQueue && !audioQueue.includes(itemId)) {
      setAudioQueue(prev => {
        const newQueue = [...prev, itemId];
        if (!isShuffleMode) {
          setOriginalQueue(newQueue);
        }
        localStorage.setItem("vocabulary-audio-queue", JSON.stringify(newQueue));
        localStorage.setItem("vocabulary-original-queue", JSON.stringify(newQueue));
        return newQueue;
      });
      return;
    }

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
      setAudioError(prev => ({
        ...prev,
        [audioKey]: ""
      }));
      const audioUrl = vocabularyItem.audioUrl;
      if (!audioUrl) {
        throw new Error("No audio available for this item");
      }

      // Create new audio element with enhanced features
      const audio = new Audio(audioUrl);
      audio.volume = audioVolume;
      audioRefs.current[audioKey] = audio;

      // Enhanced event listeners
      const updateProgress = () => {
        if (audio.duration) {
          const progress = audio.currentTime / audio.duration * 100;
          setAudioProgress(prev => ({
            ...prev,
            [audioKey]: progress
          }));
        }
      };
      const onLoadedMetadata = () => {
        setAudioDuration(prev => ({
          ...prev,
          [audioKey]: audio.duration
        }));
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
      };
      const onEnded = () => {
        setPlayingAudio(null);
        setAudioProgress(prev => ({
          ...prev,
          [audioKey]: 0
        }));

        // Handle repeat mode for single item
        if (isRepeatMode && audioQueue.length <= 1) {
          setTimeout(() => playAudio(itemId), 500);
          return;
        }

        // Handle queue playback
        const currentIndex = audioQueue.indexOf(itemId);
        if (currentIndex !== -1 && audioQueue.length > 1) {
          if (isRepeatMode && currentIndex === audioQueue.length - 1) {
            // Repeat entire playlist
            setCurrentQueueIndex(0);
            setTimeout(() => playAudio(audioQueue[0]), 500);
          } else if (currentIndex < audioQueue.length - 1) {
            // Play next item
            const nextIndex = currentIndex + 1;
            setCurrentQueueIndex(nextIndex);
            setTimeout(() => playAudio(audioQueue[nextIndex]), 500);
          }
        }
        cleanup();
      };
      const onError = (e: Event) => {
        console.error("Audio error:", e);
        setAudioError(prev => ({
          ...prev,
          [audioKey]: "Failed to load audio"
        }));
        cleanup();
      };
      const cleanup = () => {
        setAudioLoading(prev => ({
          ...prev,
          [audioKey]: false
        }));
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
      };
      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);
      await audio.play();
      setPlayingAudio(audioKey);

      // Update current queue index
      const queueIndex = audioQueue.indexOf(itemId);
      if (queueIndex !== -1) {
        setCurrentQueueIndex(queueIndex);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setAudioError(prev => ({
        ...prev,
        [audioKey]: error instanceof Error ? error.message : "Audio playback failed"
      }));
      setAudioLoading(prev => ({
        ...prev,
        [audioKey]: false
      }));
      setPlayingAudio(null);
    }
  }, [languageVocabulary, playingAudio, audioVolume, isRepeatMode, audioQueue, isShuffleMode]);

  // Audio queue management
  const playQueue = useCallback(() => {
    if (audioQueue.length > 0) {
      setCurrentQueueIndex(0);
      playAudio(audioQueue[0]);
    }
  }, [audioQueue, playAudio]);
  const skipToNext = useCallback(() => {
    if (audioQueue.length > 0) {
      const nextIndex = currentQueueIndex < audioQueue.length - 1 ? currentQueueIndex + 1 : isRepeatMode ? 0 : currentQueueIndex;
      if (nextIndex !== currentQueueIndex || isRepeatMode) {
        setCurrentQueueIndex(nextIndex);
        localStorage.setItem("vocabulary-queue-index", nextIndex.toString());
        playAudio(audioQueue[nextIndex]);
      }
    }
  }, [audioQueue, currentQueueIndex, playAudio, isRepeatMode]);
  const skipToPrevious = useCallback(() => {
    if (audioQueue.length > 0) {
      const prevIndex = currentQueueIndex > 0 ? currentQueueIndex - 1 : isRepeatMode ? audioQueue.length - 1 : currentQueueIndex;
      if (prevIndex !== currentQueueIndex || isRepeatMode) {
        setCurrentQueueIndex(prevIndex);
        localStorage.setItem("vocabulary-queue-index", prevIndex.toString());
        playAudio(audioQueue[prevIndex]);
      }
    }
  }, [audioQueue, currentQueueIndex, playAudio, isRepeatMode]);
  const clearQueue = useCallback(() => {
    // Stop current audio
    if (playingAudio && audioRefs.current[playingAudio]) {
      audioRefs.current[playingAudio].pause();
      audioRefs.current[playingAudio].currentTime = 0;
    }
    setPlayingAudio(null);
    setAudioQueue([]);
    setOriginalQueue([]);
    setCurrentQueueIndex(0);
    localStorage.removeItem("vocabulary-audio-queue");
    localStorage.removeItem("vocabulary-original-queue");
    localStorage.removeItem("vocabulary-queue-index");
  }, [playingAudio]);
  const addAllToQueue = useCallback(() => {
    const newQueue = wordsWithAudio.filter(item => !audioQueue.includes(item.id)).map(item => item.id);
    const updatedQueue = [...audioQueue, ...newQueue];
    setAudioQueue(updatedQueue);
    if (!isShuffleMode) {
      setOriginalQueue(updatedQueue);
    }
    localStorage.setItem("vocabulary-audio-queue", JSON.stringify(updatedQueue));
    localStorage.setItem("vocabulary-original-queue", JSON.stringify(updatedQueue));
  }, [wordsWithAudio, audioQueue, isShuffleMode]);
  const addSelectedToQueue = useCallback(() => {
    const newQueue = selectedItems.filter(id => {
      const item = languageVocabulary.find(v => v.id === id);
      return item?.audioUrl && !audioQueue.includes(id);
    });
    const updatedQueue = [...audioQueue, ...newQueue];
    setAudioQueue(updatedQueue);
    if (!isShuffleMode) {
      setOriginalQueue(updatedQueue);
    }
    localStorage.setItem("vocabulary-audio-queue", JSON.stringify(updatedQueue));
    localStorage.setItem("vocabulary-original-queue", JSON.stringify(updatedQueue));
  }, [selectedItems, languageVocabulary, audioQueue, isShuffleMode]);
  const shuffleQueue = useCallback(() => {
    if (audioQueue.length <= 1) return;
    if (!_isShuffleMode) {
      // Enable shuffle mode
      setOriginalQueue([...audioQueue]);
      const shuffled = [...audioQueue].sort(() => Math.random() - 0.5);
      setAudioQueue(shuffled);
      _setIsShuffleMode(true);
      setCurrentQueueIndex(0);
      localStorage.setItem("vocabulary-audio-queue", JSON.stringify(shuffled));
      localStorage.setItem("vocabulary-original-queue", JSON.stringify([...audioQueue]));
      localStorage.setItem("vocabulary-shuffle-mode", "true");
      localStorage.setItem("vocabulary-queue-index", "0");
    } else {
      // Disable shuffle mode - restore original order
      setAudioQueue([...originalQueue]);
      _setIsShuffleMode(false);
      setCurrentQueueIndex(0);
      localStorage.setItem("vocabulary-audio-queue", JSON.stringify([...originalQueue]));
      localStorage.setItem("vocabulary-shuffle-mode", "false");
      localStorage.setItem("vocabulary-queue-index", "0");
    }
  }, [audioQueue, originalQueue, _isShuffleMode]);
  const removeFromQueue = useCallback((itemId: string) => {
    const currentIndex = audioQueue.indexOf(itemId);
    if (currentIndex === -1) return;

    // Stop audio if currently playing this item
    const audioKey = `${itemId}-example`;
    if (playingAudio === audioKey) {
      const audio = audioRefs.current[audioKey];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudio(null);
    }

    // Remove from both queues
    const newQueue = audioQueue.filter(id => id !== itemId);
    const newOriginalQueue = originalQueue.filter(id => id !== itemId);
    setAudioQueue(newQueue);
    setOriginalQueue(newOriginalQueue);

    // Adjust current index if needed
    if (currentIndex <= currentQueueIndex) {
      setCurrentQueueIndex(Math.max(0, currentQueueIndex - 1));
      localStorage.setItem("vocabulary-queue-index", Math.max(0, currentQueueIndex - 1).toString());
    }

    // If queue is empty, reset everything
    if (newQueue.length === 0) {
      setCurrentQueueIndex(0);
      localStorage.setItem("vocabulary-queue-index", "0");
    }
    localStorage.setItem("vocabulary-audio-queue", JSON.stringify(newQueue));
    localStorage.setItem("vocabulary-original-queue", JSON.stringify(newOriginalQueue));
  }, [audioQueue, originalQueue, currentQueueIndex, playingAudio]);
  const removeSelectedFromQueue = useCallback(() => {
    selectedItems.forEach(itemId => {
      if (audioQueue.includes(itemId)) {
        removeFromQueue(itemId);
      }
    });
  }, [selectedItems, audioQueue, removeFromQueue]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Update volume of currently playing audio when volume changes
  useEffect(() => {
    if (playingAudio && audioRefs.current[playingAudio]) {
      audioRefs.current[playingAudio].volume = audioVolume;
    }
  }, [audioVolume, playingAudio]);

  // Keyboard navigation for study mode
  useEffect(() => {
    if (viewMode !== "study") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateCard("next");
      if (e.key === "ArrowLeft") navigateCard("prev");
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        const currentItem = filteredVocabulary[currentCardIndex];
        if (currentItem) {
          toggleDefinition(currentItem.id);
        }
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        const currentItem = filteredVocabulary[currentCardIndex];
        if (currentItem) {
          playAudio(currentItem.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentCardIndex, filteredVocabulary, playAudio]);

  // Enhanced interaction handlers
  const handleDeleteVocabularyItem = (id: string) => {
    removeVocabularyItem(id);
    // Adjust current card index if needed in study mode
    if (viewMode === "study" && currentCardIndex >= filteredVocabulary.length - 1) {
      setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
    }
    // Remove from selected items if present
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    // Remove from audio queue if present
    setAudioQueue(prev => prev.filter(itemId => itemId !== id));
    setOriginalQueue(prev => prev.filter(itemId => itemId !== id));
  };
  const toggleDefinition = useCallback((id: string) => {
    setShowDefinition(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);
  const navigateCard = useCallback((direction: "prev" | "next") => {
    setCurrentCardIndex(prev => {
      if (direction === "prev") {
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
    selectedItems.forEach(id => {
      removeVocabularyItem(id);
      if (audioQueue.includes(id)) {
        removeFromQueue(id);
      }
    });
    setSelectedItems([]);
    if (viewMode === "study") {
      setCurrentCardIndex(0);
    }
  }, [selectedItems, removeVocabularyItem, viewMode]);

  // Get status color for progress
  const getProgressColor = useCallback(() => {
    if (isAtLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-green-500";
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

  // Simple Audio button component
  const AudioButton = React.memo(({
    itemId,
    size = "sm" as const,
    className = "",
    showProgress = false,
    showAddToQueue = false
  }: {
    itemId: string;
    size?: "sm" | "default" | "lg" | "icon";
    className?: string;
    showProgress?: boolean;
    showAddToQueue?: boolean;
  }) => {
    const audioKey = `${itemId}-example`;
    const isLoading = audioLoading[audioKey];
    const isPlaying = playingAudio === audioKey;
    const progress = audioProgress[audioKey] || 0;
    const error = audioError[audioKey];
    const vocabularyItem = languageVocabulary.find(item => item.id === itemId);
    const hasAudio = vocabularyItem?.audioUrl;
    const isInQueue = audioQueue.includes(itemId);
    if (!hasAudio) return null;
    return <div className="relative group flex items-center gap-1">
          <Button variant="ghost" size={size} onClick={e => {
        e.stopPropagation();
        playAudio(itemId);
      }} className={`${className} transition-all duration-200 ${isPlaying ? "text-primary bg-primary/10 shadow-sm" : error ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary hover:bg-primary/5"} ${isInQueue ? "ring-2 ring-primary/20" : ""}`} disabled={isLoading} title={error ? `Error: ${error}` : isPlaying ? "Stop audio" : "Play audio"} aria-label={isPlaying ? "Stop audio" : "Play audio"}>
            {isLoading ? <Loader2 className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} animate-spin`} /> : error ? <AlertCircle className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} /> : isPlaying ? <div className="relative">
                <Pause className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />
                {showProgress && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-100" style={{
              width: `${progress}%`
            }} />
                  </div>}
              </div> : <Play className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />}
          </Button>

          {/* Add to Queue Button */}
          {showAddToQueue && !isInQueue && <Button variant="ghost" size="sm" onClick={e => {
        e.stopPropagation();
        setAudioQueue(prev => {
          const newQueue = [...prev, itemId];
          if (!isShuffleMode) {
            setOriginalQueue(newQueue);
          }
          localStorage.setItem("vocabulary-audio-queue", JSON.stringify(newQueue));
          localStorage.setItem("vocabulary-original-queue", JSON.stringify(newQueue));
          return newQueue;
        });
      }} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200" title="Add to playlist">
              <Plus className="h-3 w-3" />
            </Button>}

          {/* Remove from Queue Button */}
          {showAddToQueue && isInQueue && <Button variant="ghost" size="sm" onClick={e => {
        e.stopPropagation();
        removeFromQueue(itemId);
      }} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200" title="Remove from playlist">
              <X className="h-3 w-3" />
            </Button>}

          {/* Queue indicator */}
          {isInQueue && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">{audioQueue.indexOf(itemId) + 1}</span>
            </div>}
        </div>;
  });

  // Playlist Guide Component
  const PlaylistGuide = () => <Dialog open={showPlaylistGuide} onOpenChange={open => {
    setShowPlaylistGuide(open);
    if (!open && !hasSeenGuide) {
      setHasSeenGuide(true);
      localStorage.setItem("vocabulary-guide-seen", "true");
    }
  }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Audio Playlist Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to create and use audio playlists for effective vocabulary practice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Words to Playlist
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Build your audio playlist by adding vocabulary words. You can:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                <li>
                  • Click the <Plus className="h-3 w-3 inline mx-1" /> button next to any word
                </li>
                <li>• Select multiple words and click "Add Selected to Playlist"</li>
                <li>• Use "Add All" to queue all words with audio</li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Control Playback
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Use the main playlist controls at the top to manage your listening session:
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  <span>Play/Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <SkipForward className="h-3 w-3" />
                  <span>Next word</span>
                </div>
                <div className="flex items-center gap-2">
                  <SkipBack className="h-3 w-3" />
                  <span>Previous word</span>
                </div>
                <div className="flex items-center gap-2">
                  <Repeat className="h-3 w-3" />
                  <span>Repeat playlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shuffle className="h-3 w-3" />
                  <span>Shuffle playlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3 w-3" />
                  <span>Volume control</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Practice Effectively
              </h3>
              <p className="text-sm text-muted-foreground mb-3">Maximize your learning with these tips:</p>
              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                <li>• Use repeat mode to loop through your entire playlist</li>
                <li>• Shuffle for varied practice sessions</li>
                <li>• Your playlist persists across app navigation</li>
                <li>• Practice regularly with short sessions</li>
              </ul>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
              <Sparkles className="h-4 w-4" />
              Pro Tips
            </h3>
            <ul className="text-sm space-y-1 text-blue-600">
              <li>• Your playlist is automatically saved and restored</li>
              <li>• Use the main player controls for the best experience</li>
              <li>• Shuffle and repeat work for the entire playlist</li>
              <li>• Individual word buttons add to your main playlist</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => {
          setShowPlaylistGuide(false);
          setHasSeenGuide(true);
          localStorage.setItem("vocabulary-guide-seen", "true");
        }} className="w-full">
            Got it! Start Creating Playlists
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;

  // Quick Start Guide Component
  const QuickStartGuide = () => <Dialog open={showQuickStart} onOpenChange={open => {
    setShowQuickStart(open);
    // Removed hasSeenGuide logic - popup will show based on conditions only
  }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            Create Your First Playlist!
          </DialogTitle>
          <DialogDescription>
            You have {wordsWithAudio.length} vocabulary words ready for audio practice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Create audio playlists to practice pronunciation and improve listening skills
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => {
            addAllToQueue();
            setShowQuickStart(false);
          }} className="w-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add All Words to Playlist
            </Button>

            <Button variant="outline" onClick={() => {
            setShowQuickStart(false);
            setShowPlaylistGuide(true);
          }} className="w-full">
              <HelpCircle className="h-4 w-4 mr-2" />
              Learn How Playlists Work
            </Button>

            <Button variant="ghost" onClick={() => {
            setShowQuickStart(false);
          }} className="w-full text-xs">
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;

  // Show quick start guide when page loads with vocabulary but no playlist
  useEffect(() => {
    // Only show if there are words with audio and no current playlist
    if (wordsWithAudio.length > 0 && audioQueue.length === 0) {
      const timer = setTimeout(() => {
        setShowQuickStart(true);
      }, 1000); // Reduced delay for better UX
      return () => clearTimeout(timer);
    }
  }, [wordsWithAudio.length, audioQueue.length]); // Removed hasSeenGuide dependency

  return <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-8 space-y-4 sm:space-y-6">
      {/* Main Audio Player - Mobile-friendly */}
      {audioQueue.length > 0 && <Card className="animate-in slide-in-from-top-5 duration-300 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 sticky top-2 z-10 shadow-lg">
          <CardContent className="pt-3 pb-3">
            <div className="flex flex-col gap-3">
              {/* Now Playing Info - Mobile optimized */}
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-primary truncate">
                    {audioQueue.length > 0 && currentQueueIndex < audioQueue.length ? languageVocabulary.find(item => item.id === audioQueue[currentQueueIndex])?.word || "Track not found" : "No track selected"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {audioQueue.length > 0 ? `${currentQueueIndex + 1}/${audioQueue.length} • ${_isShuffleMode ? "Shuffled" : "Original"} • ${settings.selectedLanguage}` : `${settings.selectedLanguage} playlist`}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-primary text-primary hidden sm:inline-flex">
                  Playlist
                </Badge>
              </div>

              {/* Mobile Quick Actions */}
              <div className="flex flex-wrap gap-1 sm:hidden">
                {audioQueue.length > 0 && <Button variant="ghost" size="sm" onClick={() => removeFromQueue(audioQueue[currentQueueIndex])} className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>}
                {wordsWithAudio.length > audioQueue.length && <Button variant="outline" size="sm" onClick={addAllToQueue} className="h-6 text-xs border-primary/30 hover:border-primary">
                    <Plus className="h-3 w-3 mr-1" />
                    Add All
                  </Button>}
              </div>

              {/* Desktop Quick Actions */}
              <div className="hidden sm:flex items-center gap-2 justify-end">
                {audioQueue.length > 0 && <Button variant="ghost" size="sm" onClick={() => removeFromQueue(audioQueue[currentQueueIndex])} className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>}
                {wordsWithAudio.length > audioQueue.length && <Button variant="outline" size="sm" onClick={addAllToQueue} className="h-7 text-xs border-primary/30 hover:border-primary hover:bg-primary/5">
                    <Plus className="h-3 w-3 mr-1" />
                    Add All ({wordsWithAudio.length - audioQueue.length})
                  </Button>}
                {selectedItems.length > 0 && <Button variant="outline" size="sm" onClick={addSelectedToQueue} className="h-7 text-xs border-primary/30 hover:border-primary hover:bg-primary/5">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Selected
                  </Button>}
              </div>

              {/* Main Controls - Mobile optimized */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="ghost" size="sm" onClick={skipToPrevious} disabled={audioQueue.length <= 1} className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-primary/10" title="Previous word">
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button variant="default" size="sm" onClick={playQueue} className="h-10 w-10 sm:h-12 sm:w-12 p-0 bg-primary hover:bg-primary/90 shadow-md" title="Play playlist">
                    {playingAudio ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={skipToNext} disabled={audioQueue.length <= 1} className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-primary/10" title="Next word">
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setIsRepeatMode(!isRepeatMode)} className={`h-8 w-8 sm:h-10 sm:w-10 p-0 ${isRepeatMode ? "text-primary bg-primary/10" : "hover:bg-primary/10"}`} title={isRepeatMode ? "Disable repeat" : "Enable repeat"}>
                    <Repeat className="h-3 w-3 sm:h-5 sm:w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={shuffleQueue} className={`h-8 w-8 sm:h-10 sm:w-10 p-0 ${_isShuffleMode ? "text-primary bg-primary/10" : "hover:bg-primary/10"}`} title={_isShuffleMode ? "Disable shuffle" : "Enable shuffle"}>
                    <Shuffle className="h-3 w-3 sm:h-5 sm:w-5" />
                  </Button>

                  {/* Volume Control - Hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <Button variant="ghost" size="sm" onClick={() => setAudioVolume(audioVolume === 0 ? 0.8 : 0)} className="h-8 w-8 p-0" title={`Volume: ${Math.round(audioVolume * 100)}%`}>
                      {audioVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <div className="w-20">
                      <Slider value={[audioVolume * 100]} onValueChange={([value]) => setAudioVolume(value / 100)} max={100} step={5} className="w-full" />
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setShowPlaylistGuide(true)} className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-primary/10" title="Playlist guide">
                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearQueue} className="h-6 px-1 sm:h-8 sm:px-2 text-xs hover:bg-destructive/10 hover:text-destructive" title="Clear playlist">
                    <span className="hidden sm:inline">Clear</span>
                    <X className="h-3 w-3 sm:hidden" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Enhanced Header with Stats - Mobile optimized */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-start">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Vocabulary
              </h1>
              <Badge variant="secondary" className="text-xs animate-in fade-in-50 duration-300">
                {languageVocabulary.length} words
              </Badge>
              {vocabularyStats.withAudio > 0 && <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                  <Volume2 className="h-3 w-3 mr-1" />
                  {vocabularyStats.withAudio} audio
                </Badge>}
              {audioQueue.length > 0 && <Badge variant="outline" className="text-xs border-primary text-primary">
                  <Music className="h-3 w-3 mr-1" />
                  {audioQueue.length} queued
                </Badge>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-muted-foreground text-sm animate-in slide-in-from-left-5 duration-500">
                {getMotivationalMessage()}
              </p>
              {wordsWithAudio.length > 0 && audioQueue.length === 0 && <Button variant="ghost" size="sm" onClick={() => setShowPlaylistGuide(true)} className="text-xs text-primary hover:text-primary/80 h-6 px-2 self-start sm:self-auto">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  How to create playlists?
                </Button>}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Subscription Status Alert */}
      {!subscription.isSubscribed && <Alert className={`border-l-4 transition-all duration-300 animate-in slide-in-from-top-5 ${isAtLimit ? "bg-red-50 border-red-400 shadow-red-100" : isNearLimit ? "bg-yellow-50 border-yellow-400 shadow-yellow-100" : "bg-blue-50 border-blue-400 shadow-blue-100"}`}>
          <div className="flex items-center gap-2">
            {isAtLimit ? <AlertCircle className="h-4 w-4 text-red-500" /> : isNearLimit ? <AlertCircle className="h-4 w-4 text-yellow-500" /> : <Sparkles className="h-4 w-4 text-blue-500" />}

            <AlertDescription className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isAtLimit ? "Vocabulary limit reached!" : isNearLimit ? "Approaching vocabulary limit" : "Free Plan"}
                    </span>
                    <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"} className="text-xs">
                      {vocabulary.length}/{vocabularyLimit}
                    </Badge>
                  </div>

                  {/* Enhanced Visual Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`} style={{
                  width: `${progressPercentage}%`
                }} />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {isAtLimit ? "Upgrade to add unlimited vocabulary words with enhanced audio playlists" : `${vocabularyLimit - vocabulary.length} words remaining`}
                  </p>
                </div>

                <Button variant={isAtLimit ? "default" : "outline"} size="sm" className={`transition-all duration-200 ${isAtLimit ? "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl" : "border-primary text-primary hover:bg-primary/10 hover:shadow-md"}`} onClick={() => navigate("/dashboard/subscription")}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isAtLimit ? "Upgrade Now" : "Upgrade"}
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>}

      {/* Enhanced Search and Filter Bar */}
      {languageVocabulary.length > 0 && <Card className="animate-in slide-in-from-top-5 duration-300 delay-100">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Enhanced Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200" />
                <Input placeholder="Search words or definitions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20" />
                {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted">
                    ×
                  </Button>}
              </div>
            </div>

            {/* Active Filters Display */}
            {searchTerm && <div className="flex items-center gap-2 mt-3 pt-3 border-t animate-in fade-in-50 duration-200">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="text-xs h-6 px-2 hover:bg-destructive/10 hover:text-destructive">
                  Clear
                </Button>
              </div>}
          </CardContent>
        </Card>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main content - Full width on mobile, 2/3 on desktop */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="h-full animate-in slide-in-from-left-5 duration-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Vocabulary List
                </CardTitle>
                <div className="flex items-center gap-2">
                  {filteredVocabulary.length !== languageVocabulary.length && <Badge variant="outline" className="text-xs animate-in fade-in-50 duration-300">
                      {filteredVocabulary.length} of {languageVocabulary.length}
                    </Badge>}
                  {/* Enhanced View Mode Toggle */}
                  {filteredVocabulary.length > 0 && <div className="flex bg-muted rounded-lg p-1 transition-all duration-200">
                      <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-7 px-2 transition-all duration-200" title="List view">
                        <List className="h-3 w-3" />
                      </Button>
                      <Button variant={viewMode === "study" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("study")} className="h-7 px-2 transition-all duration-200" title="Study mode">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isVocabularyLoading ? <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div> : languageVocabulary.length === 0 ? <div className="text-center py-8 sm:py-12 animate-in fade-in-50 duration-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Start building your vocabulary by adding words through the Vocabulary Builder when reading
                    exercises.
                  </p>
                </div> : filteredVocabulary.length === 0 ? <div className="text-center py-8 animate-in fade-in-50 duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting your search terms.</p>
                </div> : <>
                  {/* Enhanced Bulk Actions Bar */}
                  {selectedItems.length > 0 && <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 mb-4 flex items-center justify-between animate-in slide-in-from-top-3 duration-200 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{selectedItems.length} selected</span>
                        <Button variant="outline" size="sm" onClick={addSelectedToQueue} className="h-7 text-xs border-primary/30 hover:border-primary">
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Playlist
                        </Button>
                        {selectedItems.some(id => audioQueue.includes(id)) && <Button variant="outline" size="sm" onClick={removeSelectedFromQueue} className="h-7 text-xs border-red-300 hover:border-red-500 hover:text-red-600">
                            <X className="h-3 w-3 mr-1" />
                            Remove from Playlist
                          </Button>}
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => {
                  // Direct bulk delete
                  selectedItems.forEach(id => {
                    removeVocabularyItem(id);
                    if (audioQueue.includes(id)) {
                      removeFromQueue(id);
                    }
                  });
                  setSelectedItems([]);
                  if (viewMode === "study") {
                    setCurrentCardIndex(0);
                  }
                }} className="h-7 hover:shadow-md transition-all duration-200">
                        Delete Selected
                      </Button>
                    </div>}

                  {/* List View - Mobile optimized */}
                  {viewMode === "list" && <div className="space-y-2 sm:space-y-4">
                      {filteredVocabulary.map((item, index) => <div key={item.id} className="group relative animate-in slide-in-from-left-5 duration-300" style={{
                  animationDelay: `${index * 50}ms`
                }}>
                          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                            <div className="flex items-center gap-2 pt-1">
                              <Button variant="ghost" size="sm" onClick={() => toggleSelectItem(item.id)} className={`h-5 w-5 sm:h-6 sm:w-6 p-0 transition-all duration-200 ${selectedItems.includes(item.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}>
                                {selectedItems.includes(item.id) ? <CheckSquare className="h-3 w-3" /> : "○"}
                              </Button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h3 className="font-semibold text-primary text-sm sm:text-base">{item.word}</h3>
                                <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                                  {item.language}
                                </Badge>
                              </div>
                              {item.definition && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                                  {item.definition}
                                </p>}
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
                              <AudioButton itemId={item.id} size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" showProgress={true} showAddToQueue={true} />
                              
                            </div>
                          </div>
                        </div>)}
                    </div>}

                  {/* Enhanced Study Mode */}
                  {viewMode === "study" && <div className="space-y-4 animate-in fade-in-50 duration-500">
                      {/* Study Mode Controls */}
                      <div className="flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Study Mode</span>
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            {currentCardIndex + 1} of {filteredVocabulary.length}
                          </Badge>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            Use ← → arrows, Space, or P key
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => shuffleCards()} className="h-7 px-2 hover:bg-primary/10 transition-all duration-200" title="Random card">
                            <Shuffle className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentCardIndex(0)} className="h-7 px-2 hover:bg-primary/10 transition-all duration-200" title="Reset to first">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Study Card - Mobile optimized */}
                      <div className="relative">
                        <Card className="min-h-[250px] sm:min-h-[300px] border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-3 sm:p-4 md:p-8 h-full flex flex-col justify-center text-center">
                            <div className="space-y-4 sm:space-y-6">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary animate-in slide-in-from-top-5 duration-300">
                                  {filteredVocabulary[currentCardIndex]?.word}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <AudioButton itemId={filteredVocabulary[currentCardIndex]?.id} size="lg" className="h-9 w-9 sm:h-10 sm:w-10 p-0 shadow-md hover:shadow-lg transition-all duration-200" showProgress={true} />
                                  {!audioQueue.includes(filteredVocabulary[currentCardIndex]?.id) && <Button variant="outline" size="sm" onClick={() => {
                              const newQueue = [...audioQueue, filteredVocabulary[currentCardIndex]?.id];
                              setAudioQueue(newQueue);
                              if (!isShuffleMode) {
                                setOriginalQueue(newQueue);
                              }
                            }} className="h-9 px-2 sm:h-10 sm:px-3 border-primary/30 hover:border-primary text-xs sm:text-sm" title="Add to playlist">
                                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>}
                                </div>
                              </div>

                              <Button variant="outline" onClick={() => toggleDefinition(filteredVocabulary[currentCardIndex]?.id)} className="mx-auto transition-all duration-200 hover:shadow-md border-primary/30 hover:border-primary text-sm">
                                {showDefinition[filteredVocabulary[currentCardIndex]?.id] ? <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide Definition
                                  </> : <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show Definition
                                  </>}
                              </Button>

                              {showDefinition[filteredVocabulary[currentCardIndex]?.id] && <div className="space-y-3 sm:space-y-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                                  {filteredVocabulary[currentCardIndex]?.definition && <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                      {filteredVocabulary[currentCardIndex].definition}
                                    </p>}
                                  {filteredVocabulary[currentCardIndex]?.exampleSentence && <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 sm:p-4 max-w-xl mx-auto border border-primary/20">
                                      <div className="flex items-start gap-2 sm:gap-3">
                                        <p className="text-xs sm:text-sm italic text-muted-foreground flex-1">
                                          "{filteredVocabulary[currentCardIndex].exampleSentence}"
                                        </p>
                                        <AudioButton itemId={filteredVocabulary[currentCardIndex].id} size="sm" className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0" />
                                      </div>
                                    </div>}
                                </div>}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Enhanced Navigation Arrows - Mobile optimized */}
                        <Button variant="ghost" size="sm" onClick={() => navigateCard("prev")} className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 border border-primary/20" disabled={filteredVocabulary.length <= 1}>
                          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigateCard("next")} className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 border border-primary/20" disabled={filteredVocabulary.length <= 1}>
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </div>

                      {/* Enhanced Study Progress */}
                      <div className="flex justify-center">
                        <div className="flex gap-1 bg-muted/50 rounded-full p-2">
                          {filteredVocabulary.map((_, index) => <button key={index} onClick={() => setCurrentCardIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentCardIndex ? "bg-primary shadow-lg scale-125" : "bg-muted hover:bg-primary/50"}`} aria-label={`Go to card ${index + 1}`} />)}
                        </div>
                      </div>
                    </div>}
                </>}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Simplified Tools */}
        <div className="space-y-4">
          {/* Simplified Tools Card - Removed redundant Practice tab */}
          <Card className="h-full animate-in slide-in-from-right-5 duration-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vocabulary Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="stats" className="flex-1 text-xs transition-all duration-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex-1 text-xs transition-all duration-200">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-3">
                  {languageVocabulary.length > 0 ? <>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 mb-3 border border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          Vocabulary Statistics
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total words:</span>
                            <span className="font-medium">{vocabularyStats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>With audio:</span>
                            <span className="font-medium">{vocabularyStats.withAudio}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>In playlist:</span>
                            <span className="font-medium">{audioQueue.length}</span>
                          </div>
                          {searchTerm && <div className="flex justify-between">
                              <span>Filtered:</span>
                              <span className="font-medium">{vocabularyStats.filtered}</span>
                            </div>}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        {wordsWithAudio.length > 0 && audioQueue.length === 0 && <Button onClick={() => setShowQuickStart(true)} className="w-full" size="sm">
                            <Music className="h-4 w-4 mr-2" />
                            Create Audio Playlist
                          </Button>}

                        {audioQueue.length > 0 && <Button onClick={playQueue} className="w-full" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Play Playlist ({audioQueue.length} words)
                          </Button>}

                        <Button variant="outline" onClick={() => setShowPlaylistGuide(true)} className="w-full" size="sm">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Playlist Guide
                        </Button>
                      </div>
                    </> : <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Add vocabulary words to see statistics</p>
                    </div>}
                </TabsContent>

                <TabsContent value="export" className="space-y-3">
                  {languageVocabulary.length > 0 ? <>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 mb-3 border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Download className="h-4 w-4" />
                          Export {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyExport vocabulary={languageVocabulary} />
                    </> : <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Add vocabulary words to enable export</p>
                    </div>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Enhanced Subscription Upgrade Card */}
          {!subscription.isSubscribed && <div className="mt-4 animate-in slide-in-from-right-5 duration-500 delay-200">
              <UpgradePrompt title="Unlimited Vocabulary" message="Premium subscribers can create unlimited vocabulary lists, export all their flashcards with audio, and access advanced audio playlist features with unlimited queue capacity." />
            </div>}
        </div>
      </div>

      {/* Playlist Guide */}
      <PlaylistGuide />

      {/* Quick Start Guide */}
      <QuickStartGuide />
    </div>;
};
export default VocabularyPage;