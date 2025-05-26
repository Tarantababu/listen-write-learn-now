import { useState, useEffect } from "react"
import { Flame, Trophy, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StreakCalendar } from "./StreakCalendar"
import type { StreakData } from "@/services/streakService"
import { cn } from "@/lib/utils"

// Mock implementations for demo
const mockGetUserStreak = async (userId: string, language: string): Promise<StreakData> => {
  return {
    currentStreak: 7,
    longestStreak: 15,
    lastActivityDate: new Date().toISOString(),
    streakActive: true,
  }
}

const mockUseAuth = () => ({ user: { id: "user123" } })
const mockUseUserSettingsContext = () => ({ settings: { selectedLanguage: "en" } })

export function StreakIndicator() {
  const { user } = mockUseAuth()
  const { settings } = mockUseUserSettingsContext()
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakActive: false,
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadStreakData()
    }
  }, [user, settings.selectedLanguage])

  const loadStreakData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await mockGetUserStreak(user.id, settings.selectedLanguage)
      setStreakData(data)
    } catch (error) {
      console.error("Error loading streak data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return "legendary"
    if (streak >= 14) return "fire"
    if (streak >= 7) return "hot"
    if (streak >= 3) return "warm"
    return "cold"
  }

  const getStreakColors = (level: string, active: boolean) => {
    if (!active) return "text-muted-foreground"

    switch (level) {
      case "legendary":
        return "text-purple-500"
      case "fire":
        return "text-red-500"
      case "hot":
        return "text-orange-500"
      case "warm":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  const getStreakGradient = (level: string, active: boolean) => {
    if (!active) return ""

    switch (level) {
      case "legendary":
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30"
      case "fire":
        return "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30"
      case "hot":
        return "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30"
      case "warm":
        return "bg-gradient-to-r from-yellow-500/20 to-orange-400/20 border-yellow-500/30"
      default:
        return "bg-muted/50 border-muted"
    }
  }

  const getStreakEmoji = (level: string) => {
    switch (level) {
      case "legendary":
        return "🔥"
      case "fire":
        return "🔥"
      case "hot":
        return "🔥"
      case "warm":
        return "✨"
      default:
        return "💫"
    }
  }

  const getMotivationalMessage = (streak: number, active: boolean) => {
    if (!active) return "Start your streak today!"
    if (streak >= 30) return "Legendary streak! You're unstoppable!"
    if (streak >= 14) return "On fire! Keep the momentum going!"
    if (streak >= 7) return "Great consistency! You're building a habit!"
    if (streak >= 3) return "Nice start! Keep it up!"
    return "Every day counts!"
  }

  if (!user) {
    return null
  }

  const streakLevel = getStreakLevel(streakData.currentStreak)
  const streakColors = getStreakColors(streakLevel, streakData.streakActive)
  const streakGradient = getStreakGradient(streakLevel, streakData.streakActive)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 animate-pulse">
        <Flame className="h-4 w-4 text-muted-foreground" />
        <div className="h-4 w-8 bg-muted-foreground/20 rounded" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(true)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2 h-auto rounded-lg border transition-all duration-300 hover:scale-105",
                streakGradient,
                streakData.streakActive ? "shadow-lg hover:shadow-xl" : "hover:bg-muted/80",
              )}
            >
              {/* Flame Icon with Animation */}
              <div className="relative">
                <Flame
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    streakColors,
                    streakData.streakActive && streakLevel !== "cold" && "animate-pulse",
                  )}
                />
                {streakData.streakActive && streakLevel === "legendary" && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  </div>
                )}
              </div>

              {/* Streak Information */}
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className={cn("font-bold text-lg", streakColors)}>{streakData.currentStreak}</span>
                  {streakLevel !== "cold" && streakData.streakActive && (
                    <span className="text-sm">{getStreakEmoji(streakLevel)}</span>
                  )}
                </div>

                {/* Streak Level Badge */}
                {streakData.streakActive && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-2 py-0 h-5",
                      streakLevel === "legendary" && "bg-purple-100 text-purple-700 border-purple-200",
                      streakLevel === "fire" && "bg-red-100 text-red-700 border-red-200",
                      streakLevel === "hot" && "bg-orange-100 text-orange-700 border-orange-200",
                      streakLevel === "warm" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                    )}
                  >
                    {streakLevel.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Progress Indicator */}
              {streakData.streakActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      streakLevel === "legendary" && "bg-gradient-to-r from-purple-500 to-pink-500",
                      streakLevel === "fire" && "bg-gradient-to-r from-red-500 to-orange-500",
                      streakLevel === "hot" && "bg-gradient-to-r from-orange-500 to-yellow-500",
                      streakLevel === "warm" && "bg-gradient-to-r from-yellow-500 to-orange-400",
                    )}
                    style={{
                      width: `${Math.min(((streakData.currentStreak % 7) / 7) * 100 + 14, 100)}%`,
                    }}
                  />
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Learning Streak</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-medium">{streakData.currentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Best:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {streakData.longestStreak} days
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2">
                {getMotivationalMessage(streakData.currentStreak, streakData.streakActive)}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        <StreakCalendar isOpen={showCalendar} onOpenChange={setShowCalendar} />
      </>
    </TooltipProvider>
  )
}

// Demo component
export default function Component() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Enhanced Streak Indicator</h2>
        <p className="text-muted-foreground">
          Hover over the streak indicator to see detailed information, and click to open the calendar.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <StreakIndicator />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <h3 className="font-medium text-foreground">Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Dynamic color schemes based on streak level</li>
          <li>Animated flame icon for active streaks</li>
          <li>Progress indicator at the bottom</li>
          <li>Detailed tooltip with current and best streak</li>
          <li>Motivational messages</li>
          <li>Streak level badges (Warm, Hot, Fire, Legendary)</li>
          <li>Smooth hover animations and scaling</li>
        </ul>
      </div>
    </div>
  )
}
