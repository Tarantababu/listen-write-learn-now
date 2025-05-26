import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getActivityCalendar, type ActivityDay } from "@/services/streakService"
import { useAuth } from "@/contexts/AuthContext"
import { useUserSettingsContext } from "@/contexts/UserSettingsContext"
import { cn } from "@/lib/utils"

interface StreakCalendarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function StreakCalendar({ isOpen, onOpenChange }: StreakCalendarProps) {
  const { user } = useAuth()
  const { settings } = useUserSettingsContext()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activities, setActivities] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadActivityData()
    }
  }, [isOpen, user, settings.selectedLanguage])

  const loadActivityData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getActivityCalendar(user.id, settings.selectedLanguage, 3)
      setActivities(data)
    } catch (error) {
      console.error("Error loading activity calendar:", error)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Get the complete calendar grid including previous/next month days
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const monthDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const getActivityForDate = (date: Date): ActivityDay | undefined => {
    return activities.find((activity) => {
      // Convert activity.date to Date object if it's a string
      const activityDate = typeof activity.date === "string" ? new Date(activity.date) : activity.date
      return isSameDay(activityDate, date)
    })
  }

  const getDayClassName = (date: Date): string => {
    const activity = getActivityForDate(date)
    const isToday = isSameDay(date, new Date())
    const isCurrentMonth = isSameMonth(date, currentMonth)

    let baseClasses = "w-8 h-8 flex items-center justify-center text-sm relative"

    if (!isCurrentMonth) {
      baseClasses += " text-muted-foreground opacity-50"
    }

    if (isToday) {
      baseClasses += " ring-2 ring-primary"
    }

    if (activity?.hasActivity) {
      baseClasses += " bg-primary text-primary-foreground rounded-full font-medium"
    }

    return baseClasses
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 h-6 w-6 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        <DialogHeader className="pb-2">
          <DialogTitle>Learning Streak Calendar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>

            <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="w-8 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((date) => (
                <div key={date.toISOString()} className={cn(getDayClassName(date))}>
                  {format(date, "d")}
                </div>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-muted-foreground">Loading calendar...</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
