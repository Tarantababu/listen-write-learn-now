import React, { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import VocabularyPlaylist from "@/components/VocabularyPlaylist"
import VocabularyCard from "@/components/VocabularyCard"
import { useVocabularyContext } from "@/contexts/VocabularyContext"
import { useUserSettingsContext } from "@/contexts/UserSettingsContext"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sparkles,
  Search,
  BookOpen,
  Download,
  Trophy,
  AlertCircle,
  CheckCircle,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Volume2,
  VolumeX,
  Loader2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
} from "lucide-react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useNavigate } from "react-router-dom"
import UpgradePrompt from "@/components/UpgradePrompt"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VocabularyExport from "@/components/VocabularyExport"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

const VocabularyPage = () => {
  const {
    vocabulary,
    getVocabularyByLanguage,
    vocabularyLimit,
    removeVocabularyItem,
    isLoading: isVocabularyLoading = false,
  } = useVocabularyContext()
  const { settings } = useUserSettingsContext()
  const { subscription } = useSubscription()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Enhanced Audio refs and state
  const audioRefs = useRef<{
    [key: string]: HTMLAudioElement
  }>({})
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState<{
    [key: string]: boolean
  }>({})
  const [audioProgress, setAudioProgress] = useState<{
    [key: string]: number
  }>({})
  const [audioDuration, setAudioDuration] = useState<{
    [key: string]: number
  }>({})
  const [audioError, setAudioError] = useState<{
    [key: string]: string
  }>({})
  const [audioVolume, setAudioVolume] = useState(0.8)
  const [isRepeatMode, setIsRepeatMode] = useState(false)
  const [audioQueue, setAudioQueue] = useState<string[]>([])
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0)

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState("")
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "cards" | "study">("list")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showDefinition, setShowDefinition] = useState<{
    [key: string]: boolean
  }>({})
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage)

  // Enhanced filtering with search
  const filteredVocabulary = useMemo(() => {
    let filtered = languageVocabulary

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.word?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.definition?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    return filtered
  }, [languageVocabulary, searchTerm])

  // Progress calculations for better UX
  const progressPercentage = Math.min((vocabulary.length / vocabularyLimit) * 100, 100)
  const isNearLimit = vocabulary.length >= vocabularyLimit * 0.8
  const isAtLimit = vocabulary.length >= vocabularyLimit

  // Stats for better UX
  const vocabularyStats = useMemo(() => {
    return {
      total: languageVocabulary.length,
      filtered: filteredVocabulary.length,
    }
  }, [languageVocabulary, filteredVocabulary])

  // Enhanced Audio functionality with queue management
  const playAudio = useCallback(
    async (itemId: string, addToQueue = false) => {
      const audioKey = `${itemId}-example`

      // Handle queue management
      if (addToQueue && !audioQueue.includes(itemId)) {
        setAudioQueue((prev) => [...prev, itemId])
        return
      }

      // Stop currently playing audio
      if (playingAudio && playingAudio !== audioKey) {
        const currentAudio = audioRefs.current[playingAudio]
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      // Toggle if clicking the same audio
      if (playingAudio === audioKey) {
        const audio = audioRefs.current[audioKey]
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        setPlayingAudio(null)
        return
      }

      try {
        setAudioLoading((prev) => ({
          ...prev,
          [audioKey]: true,
        }))
        setAudioError((prev) => ({
          ...prev,
          [audioKey]: "",
        }))

        const vocabularyItem = filteredVocabulary.find((item) => item.id === itemId)
        if (!vocabularyItem) {
          throw new Error("Vocabulary item not found")
        }

        const audioUrl = vocabularyItem.audioUrl
        if (!audioUrl) {
          throw new Error("No audio available for this item")
        }

        // Create new audio element with enhanced features
        const audio = new Audio(audioUrl)
        audio.volume = audioVolume
        audioRefs.current[audioKey] = audio

        // Enhanced event listeners
        const updateProgress = () => {
          if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100
            setAudioProgress((prev) => ({
              ...prev,
              [audioKey]: progress,
            }))
          }
        }

        const onLoadedMetadata = () => {
          setAudioDuration((prev) => ({
            ...prev,
            [audioKey]: audio.duration,
          }))
          setAudioLoading((prev) => ({
            ...prev,
            [audioKey]: false,
          }))
        }

        const onEnded = () => {
          setPlayingAudio(null)
          setAudioProgress((prev) => ({
            ...prev,
            [audioKey]: 0,
          }))

          // Handle repeat mode
          if (isRepeatMode) {
            setTimeout(() => playAudio(itemId), 500)
            return
          }

          // Handle queue playback
          if (audioQueue.length > 0 && currentQueueIndex < audioQueue.length - 1) {
            const nextIndex = currentQueueIndex + 1
            setCurrentQueueIndex(nextIndex)
            setTimeout(() => playAudio(audioQueue[nextIndex]), 500)
          }

          cleanup()
        }

        const onError = (e: Event) => {
          console.error("Audio error:", e)
          setAudioError((prev) => ({
            ...prev,
            [audioKey]: "Failed to load audio",
          }))
          cleanup()
        }

        const cleanup = () => {
          setAudioLoading((prev) => ({
            ...prev,
            [audioKey]: false,
          }))
          audio.removeEventListener("timeupdate", updateProgress)
          audio.removeEventListener("loadedmetadata", onLoadedMetadata)
          audio.removeEventListener("ended", onEnded)
          audio.removeEventListener("error", onError)
        }

        audio.addEventListener("timeupdate", updateProgress)
        audio.addEventListener("loadedmetadata", onLoadedMetadata)
        audio.addEventListener("ended", onEnded)
        audio.addEventListener("error", onError)

        await audio.play()
        setPlayingAudio(audioKey)
      } catch (error) {
        console.error("Error playing audio:", error)
        setAudioError((prev) => ({
          ...prev,
          [audioKey]: error instanceof Error ? error.message : "Audio playback failed",
        }))
        setAudioLoading((prev) => ({
          ...prev,
          [audioKey]: false,
        }))
        setPlayingAudio(null)
      }
    },
    [filteredVocabulary, playingAudio, audioVolume, isRepeatMode, audioQueue, currentQueueIndex],
  )

  // Audio queue management
  const playQueue = useCallback(() => {
    if (audioQueue.length > 0) {
      setCurrentQueueIndex(0)
      playAudio(audioQueue[0])
    }
  }, [audioQueue, playAudio])

  const skipToNext = useCallback(() => {
    if (audioQueue.length > 0 && currentQueueIndex < audioQueue.length - 1) {
      const nextIndex = currentQueueIndex + 1
      setCurrentQueueIndex(nextIndex)
      playAudio(audioQueue[nextIndex])
    }
  }, [audioQueue, currentQueueIndex, playAudio])

  const skipToPrevious = useCallback(() => {
    if (audioQueue.length > 0 && currentQueueIndex > 0) {
      const prevIndex = currentQueueIndex - 1
      setCurrentQueueIndex(prevIndex)
      playAudio(audioQueue[prevIndex])
    }
  }, [audioQueue, currentQueueIndex, playAudio])

  const clearQueue = useCallback(() => {
    setAudioQueue([])
    setCurrentQueueIndex(0)
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [])

  // Keyboard navigation for study mode
  useEffect(() => {
    if (viewMode !== "study") return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateCard("next")
      if (e.key === "ArrowLeft") navigateCard("prev")
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault()
        const currentItem = filteredVocabulary[currentCardIndex]
        if (currentItem) {
          toggleDefinition(currentItem.id)
        }
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        const currentItem = filteredVocabulary[currentCardIndex]
        if (currentItem) {
          playAudio(currentItem.id)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [viewMode, currentCardIndex, filteredVocabulary, playAudio])

  // Enhanced interaction handlers
  const handleDeleteVocabularyItem = (id: string) => {
    if (itemToDelete === id) {
      removeVocabularyItem(id)
      setItemToDelete(null)
      // Adjust current card index if needed in study mode
      if (viewMode === "study" && currentCardIndex >= filteredVocabulary.length - 1) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1))
      }
      // Remove from selected items if present
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id))
      // Remove from audio queue if present
      setAudioQueue((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const toggleDefinition = useCallback((id: string) => {
    setShowDefinition((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const navigateCard = useCallback(
    (direction: "prev" | "next") => {
      setCurrentCardIndex((prev) => {
        if (direction === "prev") {
          return prev > 0 ? prev - 1 : filteredVocabulary.length - 1
        } else {
          return prev < filteredVocabulary.length - 1 ? prev + 1 : 0
        }
      })
    },
    [filteredVocabulary.length],
  )

  const shuffleCards = useCallback(() => {
    setCurrentCardIndex(Math.floor(Math.random() * filteredVocabulary.length))
  }, [filteredVocabulary.length])

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }, [])

  const handleBulkDelete = useCallback(() => {
    selectedItems.forEach((id) => removeVocabularyItem(id))
    setSelectedItems([])
    setItemToDelete(null)
    // Reset study mode if needed
    if (viewMode === "study") {
      setCurrentCardIndex(0)
    }
  }, [selectedItems, removeVocabularyItem, viewMode])

  // Get status color for progress
  const getProgressColor = useCallback(() => {
    if (isAtLimit) return "bg-red-500"
    if (isNearLimit) return "bg-yellow-500"
    return "bg-green-500"
  }, [isAtLimit, isNearLimit])

  // Get motivational message based on progress
  const getMotivationalMessage = useCallback(() => {
    const count = languageVocabulary.length
    if (count === 0) return "Start building your vocabulary library! 📚"
    if (count < 10) return "Great start! Keep adding more words! 🌱"
    if (count < 50) return "You're building a solid foundation! 💪"
    if (count < 100) return "Impressive vocabulary collection! 🎯"
    return "Amazing! You're a vocabulary master! 🏆"
  }, [languageVocabulary.length])

  // Enhanced Audio button component with better visual feedback
  const AudioButton = React.memo(
    ({
      itemId,
      size = "sm" as const,
      className = "",
      showProgress = false,
      showQueue = false,
    }: {
      itemId: string
      size?: "sm" | "default" | "lg" | "icon"
      className?: string
      showProgress?: boolean
      showQueue?: boolean
    }) => {
      const audioKey = `${itemId}-example`
      const isLoading = audioLoading[audioKey]
      const isPlaying = playingAudio === audioKey
      const progress = audioProgress[audioKey] || 0
      const error = audioError[audioKey]
      const vocabularyItem = filteredVocabulary.find((item) => item.id === itemId)
      const hasAudio = vocabularyItem?.audioUrl
      const isInQueue = audioQueue.includes(itemId)

      if (!hasAudio) return null

      return (
        <div className="relative group">
          <Button
            variant="ghost"
            size={size}
            onClick={(e) => {
              e.stopPropagation()
              playAudio(itemId)
            }}
            className={`${className} transition-all duration-200 ${
              isPlaying
                ? "text-primary bg-primary/10 shadow-sm"
                : error
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            } ${isInQueue ? "ring-2 ring-primary/20" : ""}`}
            disabled={isLoading}
            title={error ? `Error: ${error}` : isPlaying ? "Stop audio" : "Play audio"}
            aria-label={isPlaying ? "Stop audio" : "Play audio"}
          >
            {isLoading ? (
              <div className="relative">
                <Loader2 className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} animate-spin`} />
                {/* Waveform-style loading animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 8 + 4}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : error ? (
              <AlertCircle className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />
            ) : isPlaying ? (
              <div className="relative">
                <Pause className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />
                {showProgress && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            ) : (
              <Play className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`} />
            )}
          </Button>

          {/* Queue indicator */}
          {showQueue && isInQueue && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">{audioQueue.indexOf(itemId) + 1}</span>
            </div>
          )}

          {/* Enhanced tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {error ? `Error: ${error}` : isPlaying ? "Playing..." : "Click to play"}
            {showQueue && <div className="text-[10px] opacity-75">Right-click to add to queue</div>}
          </div>
        </div>
      )
    },
  )

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Vocabulary
            </h1>
            <Badge variant="secondary" className="text-xs animate-in fade-in-50 duration-300">
              {languageVocabulary.length} words
            </Badge>
            {audioQueue.length > 0 && (
              <Badge variant="outline" className="text-xs border-primary text-primary">
                {audioQueue.length} queued
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm animate-in slide-in-from-left-5 duration-500">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Audio Queue Controls */}
        {audioQueue.length > 0 && (
          <Card className="p-3 animate-in slide-in-from-right-5 duration-300">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipToPrevious}
                  disabled={currentQueueIndex === 0}
                  className="h-7 w-7 p-0"
                >
                  <SkipBack className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={playQueue} className="h-7 w-7 p-0">
                  <Play className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipToNext}
                  disabled={currentQueueIndex === audioQueue.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRepeatMode(!isRepeatMode)}
                  className={`h-7 w-7 p-0 ${isRepeatMode ? "text-primary" : ""}`}
                >
                  <Repeat className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentQueueIndex + 1}/{audioQueue.length}
              </div>
              <Button variant="ghost" size="sm" onClick={clearQueue} className="h-7 px-2 text-xs">
                Clear
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Enhanced Subscription Status Alert */}
      {!subscription.isSubscribed && (
        <Alert
          className={`border-l-4 transition-all duration-300 animate-in slide-in-from-top-5 ${
            isAtLimit
              ? "bg-red-50 border-red-400 shadow-red-100"
              : isNearLimit
                ? "bg-yellow-50 border-yellow-400 shadow-yellow-100"
                : "bg-blue-50 border-blue-400 shadow-blue-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {isAtLimit ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : isNearLimit ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-500" />
            )}

            <AlertDescription className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isAtLimit
                        ? "Vocabulary limit reached!"
                        : isNearLimit
                          ? "Approaching vocabulary limit"
                          : "Free Plan"}
                    </span>
                    <Badge
                      variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {vocabulary.length}/{vocabularyLimit}
                    </Badge>
                  </div>

                  {/* Enhanced Visual Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {isAtLimit
                      ? "Upgrade to add unlimited vocabulary words with enhanced audio features"
                      : `${vocabularyLimit - vocabulary.length} words remaining`}
                  </p>
                </div>

                <Button
                  variant={isAtLimit ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-200 ${
                    isAtLimit
                      ? "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl"
                      : "border-primary text-primary hover:bg-primary/10 hover:shadow-md"
                  }`}
                  onClick={() => navigate("/dashboard/subscription")}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isAtLimit ? "Upgrade Now" : "Upgrade"}
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Enhanced Search and Filter Bar */}
      {languageVocabulary.length > 0 && (
        <Card className="animate-in slide-in-from-top-5 duration-300 delay-100">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Enhanced Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200" />
                <Input
                  placeholder="Search words or definitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioVolume(audioVolume === 0 ? 0.8 : 0)}
                    className="h-7 w-7 p-0"
                    title={`Volume: ${Math.round(audioVolume * 100)}%`}
                  >
                    {audioVolume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                  <div className="w-16">
                    <Slider
                      value={[audioVolume * 100]}
                      onValueChange={([value]) => setAudioVolume(value / 100)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {searchTerm && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t animate-in fade-in-50 duration-200">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-xs h-6 px-2 hover:bg-destructive/10 hover:text-destructive"
                >
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
          <Card className="h-full animate-in slide-in-from-left-5 duration-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Vocabulary List
                </CardTitle>
                <div className="flex items-center gap-2">
                  {filteredVocabulary.length !== languageVocabulary.length && (
                    <Badge variant="outline" className="text-xs animate-in fade-in-50 duration-300">
                      {filteredVocabulary.length} of {languageVocabulary.length}
                    </Badge>
                  )}
                  {/* Enhanced View Mode Toggle */}
                  {filteredVocabulary.length > 0 && (
                    <div className="flex bg-muted rounded-lg p-1 transition-all duration-200">
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-7 px-2 transition-all duration-200"
                        title="List view"
                      >
                        <List className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={viewMode === "cards" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("cards")}
                        className="h-7 px-2 transition-all duration-200"
                        title="Card grid view"
                      >
                        <Grid3X3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={viewMode === "study" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("study")}
                        className="h-7 px-2 transition-all duration-200"
                        title="Study mode"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isVocabularyLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : languageVocabulary.length === 0 ? (
                <div className="text-center py-8 sm:py-12 animate-in fade-in-50 duration-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Start building your vocabulary by adding words through the Vocabulary Builder when reading
                    exercises.
                  </p>
                </div>
              ) : filteredVocabulary.length === 0 ? (
                <div className="text-center py-8 animate-in fade-in-50 duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting your search terms.</p>
                </div>
              ) : (
                <>
                  {/* Enhanced Bulk Actions Bar */}
                  {selectedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 mb-4 flex items-center justify-between animate-in slide-in-from-top-3 duration-200 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{selectedItems.length} selected</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQueue = [...audioQueue]
                            selectedItems.forEach((id) => {
                              if (!newQueue.includes(id)) {
                                newQueue.push(id)
                              }
                            })
                            setAudioQueue(newQueue)
                          }}
                          className="h-7 text-xs"
                        >
                          Add to Queue
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setItemToDelete("bulk")}
                        className="h-7 hover:shadow-md transition-all duration-200"
                      >
                        Delete Selected
                      </Button>
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === "list" && (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredVocabulary.map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative animate-in slide-in-from-left-5 duration-300"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <VocabularyCard
                            item={item}
                            onDelete={() => setItemToDelete(item.id)}
                            isSelected={selectedItems.includes(item.id)}
                            onSelect={() => toggleSelectItem(item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Card Grid View */}
                  {viewMode === "cards" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredVocabulary.map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative animate-in slide-in-from-bottom-5 duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <Card
                            className={`h-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${
                              selectedItems.includes(item.id)
                                ? "border-primary shadow-primary/20 shadow-lg"
                                : "hover:border-primary/30 hover:shadow-primary/10"
                            }`}
                          >
                            <CardContent className="p-4 h-full flex flex-col justify-between">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-semibold text-lg text-primary group-hover:text-primary/80 transition-colors duration-200">
                                    {item.word}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    <AudioButton
                                      itemId={item.id}
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      showProgress={true}
                                      showQueue={true}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleDefinition(item.id)}
                                      className="h-6 w-6 p-0 hover:bg-primary/10 transition-all duration-200"
                                    >
                                      {showDefinition[item.id] ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {showDefinition[item.id] && (
                                  <div className="space-y-2 text-sm animate-in fade-in-50 slide-in-from-top-2 duration-200">
                                    {item.definition && (
                                      <p className="text-muted-foreground leading-relaxed">{item.definition}</p>
                                    )}
                                    {item.exampleSentence && (
                                      <div className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2 bg-primary/5 rounded-r p-2">
                                        <div className="flex items-start gap-2">
                                          <span className="flex-1">"{item.exampleSentence}"</span>
                                          <AudioButton
                                            itemId={item.id}
                                            size="sm"
                                            className="h-4 w-4 p-0 mt-0.5 flex-shrink-0"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!showDefinition[item.id] && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground text-sm opacity-60">Click eye to reveal</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-muted/50">
                                <Badge variant="secondary" className="text-xs">
                                  {item.language}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleSelectItem(item.id)
                                    }}
                                    className={`h-6 w-6 p-0 transition-all duration-200 ${
                                      selectedItems.includes(item.id)
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                    }`}
                                  >
                                    {selectedItems.includes(item.id) ? "✓" : "○"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setItemToDelete(item.id)
                                    }}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Study Mode */}
                  {viewMode === "study" && (
                    <div className="space-y-4 animate-in fade-in-50 duration-500">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shuffleCards()}
                            className="h-7 px-2 hover:bg-primary/10 transition-all duration-200"
                            title="Random card"
                          >
                            <Shuffle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentCardIndex(0)}
                            className="h-7 px-2 hover:bg-primary/10 transition-all duration-200"
                            title="Reset to first"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Study Card */}
                      <div className="relative">
                        <Card className="min-h-[300px] border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-4 sm:p-8 h-full flex flex-col justify-center text-center">
                            <div className="space-y-6">
                              <div className="flex items-center justify-center gap-4">
                                <h2 className="text-2xl sm:text-3xl font-bold text-primary animate-in slide-in-from-top-5 duration-300">
                                  {filteredVocabulary[currentCardIndex]?.word}
                                </h2>
                                <AudioButton
                                  itemId={filteredVocabulary[currentCardIndex]?.id}
                                  size="lg"
                                  className="h-10 w-10 p-0 shadow-md hover:shadow-lg transition-all duration-200"
                                  showProgress={true}
                                />
                              </div>

                              <Button
                                variant="outline"
                                onClick={() => toggleDefinition(filteredVocabulary[currentCardIndex]?.id)}
                                className="mx-auto transition-all duration-200 hover:shadow-md border-primary/30 hover:border-primary"
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

                              {showDefinition[filteredVocabulary[currentCardIndex]?.id] && (
                                <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                                  {filteredVocabulary[currentCardIndex]?.definition && (
                                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                      {filteredVocabulary[currentCardIndex].definition}
                                    </p>
                                  )}
                                  {filteredVocabulary[currentCardIndex]?.exampleSentence && (
                                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 max-w-xl mx-auto border border-primary/20">
                                      <div className="flex items-start gap-3">
                                        <p className="text-sm italic text-muted-foreground flex-1">
                                          "{filteredVocabulary[currentCardIndex].exampleSentence}"
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
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Enhanced Navigation Arrows */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateCard("prev")}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 border border-primary/20"
                          disabled={filteredVocabulary.length <= 1}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateCard("next")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 border border-primary/20"
                          disabled={filteredVocabulary.length <= 1}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* Enhanced Study Progress */}
                      <div className="flex justify-center">
                        <div className="flex gap-1 bg-muted/50 rounded-full p-2">
                          {filteredVocabulary.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentCardIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentCardIndex
                                  ? "bg-primary shadow-lg scale-125"
                                  : "bg-muted hover:bg-primary/50"
                              }`}
                              aria-label={`Go to card ${index + 1}`}
                            />
                          ))}
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
          <Card className="h-full animate-in slide-in-from-right-5 duration-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vocabulary Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="practice" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="practice" className="flex-1 text-xs transition-all duration-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    Practice
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex-1 text-xs transition-all duration-200">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="practice" className="space-y-3">
                  {languageVocabulary.length > 0 ? (
                    <>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 mb-3 border border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Ready to practice with {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyPlaylist vocabulary={languageVocabulary} />
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Add vocabulary words to start practicing</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="export" className="space-y-3">
                  {languageVocabulary.length > 0 ? (
                    <>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 mb-3 border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Download className="h-4 w-4" />
                          Export {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyExport vocabulary={languageVocabulary} />
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <Download className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Add vocabulary words to enable export</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Enhanced Subscription Upgrade Card */}
          {!subscription.isSubscribed && (
            <div className="mt-4 animate-in slide-in-from-right-5 duration-500 delay-200">
              <UpgradePrompt
                title="Unlimited Vocabulary"
                message="Premium subscribers can create unlimited vocabulary lists, export all their flashcards with audio, and access advanced audio features like playlists and repeat modes."
              />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="animate-in fade-in-50 zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {itemToDelete === "bulk" ? "Delete Selected Items" : "Delete Vocabulary Item"}
            </DialogTitle>
            <DialogDescription>
              {itemToDelete === "bulk"
                ? `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`
                : "Are you sure you want to delete this vocabulary item? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)} className="transition-all duration-200">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (itemToDelete === "bulk") {
                  handleBulkDelete()
                } else if (itemToDelete) {
                  handleDeleteVocabularyItem(itemToDelete)
                }
              }}
              className="transition-all duration-200 hover:shadow-md"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VocabularyPage
