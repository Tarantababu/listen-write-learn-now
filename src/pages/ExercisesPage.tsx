import type React from "react"
import { useState, useEffect } from "react"
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  BookOpen,
  Trophy,
  Search,
  Grid,
  List,
  Star,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react"
import { useExerciseContext } from "@/contexts/ExerciseContext"
import { useDirectoryContext } from "@/contexts/DirectoryContext"
import { DirectoryProvider } from "@/contexts/DirectoryContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import DirectoryBrowser from "@/components/DirectoryBrowser"
import type { Exercise } from "@/types"
import { toast } from "sonner"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { useUserSettingsContext } from "@/contexts/UserSettingsContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import DefaultExercisesSection from "@/components/exercises/DefaultExercisesSection"

// Import the components we've just created
import FilterBar from "@/components/exercises/FilterBar"
import EmptyStateMessage from "@/components/exercises/EmptyStateMessage"
import ExerciseGrid from "@/components/exercises/ExerciseGrid"
import PaginationControls from "@/components/exercises/PaginationControls"
import ExerciseFormModal from "@/components/exercises/ExerciseFormModal"
import DeleteExerciseDialog from "@/components/exercises/DeleteExerciseDialog"
import PracticeModal from "@/components/exercises/PracticeModal"
import MoveExerciseModal from "@/components/MoveExerciseModal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles } from "lucide-react"

const ExercisesPage: React.FC = () => {
  const {
    exercises,
    selectExercise,
    selectedExercise,
    deleteExercise,
    markProgress,
    canCreateMore,
    exerciseLimit,
    canEdit,
    copyDefaultExercise,
    refreshExercises,
  } = useExerciseContext()
  const { currentDirectoryId } = useDirectoryContext()
  const { settings } = useUserSettingsContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [key, setKey] = useState(Date.now())
  const { subscription } = useSubscription()

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)

  // Directory browser state
  const [isDirectoryCollapsed, setIsDirectoryCollapsed] = useState(false)

  // Selected exercise state
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)
  const [exerciseToPractice, setExerciseToPractice] = useState<Exercise | null>(null)
  const [exerciseToMove, setExerciseToMove] = useState<Exercise | null>(null)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Reset pagination when filters change or when directory changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCompleted, selectedTag, currentDirectoryId])

  // Debug the directory change
  useEffect(() => {
    console.log("Current directory changed:", currentDirectoryId)
  }, [currentDirectoryId])

  // Handle URL parameters for default exercises
  useEffect(() => {
    const handleDefaultExerciseFromURL = async () => {
      const defaultExerciseId = searchParams.get("defaultExerciseId")
      const action = searchParams.get("action")

      if (defaultExerciseId) {
        try {
          console.log("Processing default exercise from URL:", defaultExerciseId, action)

          // Find if we already have this exercise copied
          const existingExercise = exercises.find((ex) => ex.default_exercise_id === defaultExerciseId)

          if (existingExercise) {
            console.log("Exercise already exists in user exercises:", existingExercise.id)

            if (action === "practice") {
              // Use existing copy to practice
              setExerciseToPractice(existingExercise)
              setIsPracticeModalOpen(true)
            }
          } else {
            // Copy the exercise first, then practice
            console.log("Copying exercise from default:", defaultExerciseId)
            const newExercise = await copyDefaultExercise(defaultExerciseId)

            if (action === "practice") {
              setExerciseToPractice(newExercise)
              setIsPracticeModalOpen(true)
            }

            toast.success("Exercise added to your list")
          }

          // Clear the URL parameters after processing
          navigate("/dashboard/exercises", { replace: true })

          // Refresh to ensure the lists are updated
          refreshExercises()
        } catch (error) {
          console.error("Error processing default exercise:", error)
          toast.error("Failed to process the exercise")
        }
      }
    }

    handleDefaultExerciseFromURL()
  }, [searchParams, copyDefaultExercise, exercises, navigate, refreshExercises])

  // Get all unique tags from exercises that match the selected language
  const languageExercises = exercises.filter((ex) => ex.language === settings.selectedLanguage && !ex.archived)

  const allTags = Array.from(new Set(languageExercises.flatMap((exercise) => exercise.tags)))

  // First filter exercises by directory and selected language
  const directoryExercises = currentDirectoryId
    ? languageExercises.filter((ex) => ex.directoryId === currentDirectoryId)
    : languageExercises

  // Then apply additional filters to the directory-filtered exercises
  const filteredExercises = directoryExercises
    .filter((ex) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          ex.title.toLowerCase().includes(searchLower) ||
          ex.text.toLowerCase().includes(searchLower) ||
          ex.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        )
      }
      return true
    })
    .filter((ex) => {
      // Completion status filter
      if (filterCompleted === null) return true
      return filterCompleted ? ex.isCompleted : !ex.isCompleted
    })
    .filter((ex) => {
      // Tag filter
      if (!selectedTag) return true
      return ex.tags.includes(selectedTag)
    })

  // Pagination
  const exercisesPerPage = viewMode === "grid" ? 6 : 8
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage)
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * exercisesPerPage,
    currentPage * exercisesPerPage,
  )

  // Calculate statistics
  const completedCount = directoryExercises.filter((ex) => ex.isCompleted).length
  const inProgressCount = directoryExercises.filter((ex) => !ex.isCompleted && ex.completionCount > 0).length
  const newCount = directoryExercises.filter((ex) => ex.completionCount === 0).length
  const completionPercentage = directoryExercises.length > 0 ? (completedCount / directoryExercises.length) * 100 : 0

  // Event handlers
  const handlePractice = (exercise: Exercise) => {
    setExerciseToPractice(exercise)
    setIsPracticeModalOpen(true)
  }

  const handleEdit = (exercise: Exercise) => {
    if (!canEdit) {
      toast.error("Editing exercises requires a premium subscription")
      return
    }
    setExerciseToEdit(exercise)
    setIsEditModalOpen(true)
  }

  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise)
    setIsDeleteDialogOpen(true)
  }

  const handleMove = (exercise: Exercise) => {
    setExerciseToMove(exercise)
    setIsMoveModalOpen(true)
  }

  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteExercise(exerciseToDelete.id)
      toast.success("Exercise deleted")
      setIsDeleteDialogOpen(false)
      setExerciseToDelete(null)
    }
  }

  const handlePracticeComplete = (accuracy: number) => {
    if (!exerciseToPractice) return

    markProgress(exerciseToPractice.id, accuracy)

    if (accuracy >= 95) {
      const updatedCompletionCount = exerciseToPractice.completionCount + 1
      if (updatedCompletionCount >= 3 && !exerciseToPractice.isCompleted) {
        toast.success("Congratulations! You have mastered this exercise!")
      } else {
        toast.success(`Great job! ${3 - updatedCompletionCount} more successful attempts until mastery.`)
      }
    }
  }

  // Function to refresh the page properly
  const refreshPage = () => {
    setKey(Date.now())
    refreshExercises()
  }

  // Clean up exercise states when modals close
  const handleAddModalClose = (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      refreshPage()
    }
  }

  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      setTimeout(() => {
        setExerciseToEdit(null)
        refreshPage()
      }, 300)
    }
  }

  const handlePracticeModalClose = (open: boolean) => {
    setIsPracticeModalOpen(open)
    if (!open) {
      setTimeout(() => {
        setExerciseToPractice(null)
        refreshPage()
      }, 300)
    }
  }

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setTimeout(() => {
        setExerciseToDelete(null)
        refreshPage()
      }, 300)
    }
  }

  const handleMoveModalClose = (open: boolean) => {
    setIsMoveModalOpen(open)
    if (!open) {
      setTimeout(() => {
        setExerciseToMove(null)
        refreshPage()
      }, 300)
    }
  }

  // Enhanced Directory Browser Component
  const EnhancedDirectoryBrowser = () => {
    const { directories } = useDirectoryContext()

    // Calculate exercise counts for each directory
    const getExerciseCount = (directoryId: string | null) => {
      return languageExercises.filter((ex) => ex.directoryId === directoryId).length
    }

    return (
      <div
        className={`transition-all duration-500 ease-in-out ${isDirectoryCollapsed ? "w-16" : "w-full md:min-w-80"}`}
      >
        <Card className="h-fit shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          {/* Header */}
          <CardHeader className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              {!isDirectoryCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Folders</h2>
                    <p className="text-blue-100 text-sm">Organize your learning</p>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDirectoryCollapsed(!isDirectoryCollapsed)}
                className="h-10 w-10 p-0 hover:bg-white/20 text-white border-white/20"
              >
                {isDirectoryCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>

            {!isDirectoryCollapsed && currentDirectoryId && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="h-4 w-4 mr-1" />
                      <span className="font-bold text-lg">{completedCount}</span>
                    </div>
                    <div className="text-blue-100 text-xs font-medium">Mastered</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-bold text-lg">{inProgressCount}</span>
                    </div>
                    <div className="text-blue-100 text-xs font-medium">Learning</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="font-bold text-lg">{newCount}</span>
                    </div>
                    <div className="text-blue-100 text-xs font-medium">New</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100 text-sm font-medium">Progress</span>
                    <span className="text-white text-sm font-bold">{Math.round(completionPercentage)}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2 bg-white/20" />
                </div>
              </div>
            )}
          </CardHeader>

          {!isDirectoryCollapsed && (
            <CardContent className="p-4">
              {/* Custom Directory Browser UI */}
              <div className="space-y-3">
                {/* All Exercises Option */}
                <div
                  onClick={() => {
                    /* Handle all exercises click - you'll need to implement this based on your DirectoryContext */
                  }}
                  className={`
                    group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
                    ${
                      !currentDirectoryId
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border border-gray-200 hover:border-blue-200 hover:shadow-md"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${!currentDirectoryId ? "bg-white/20" : "bg-blue-100 group-hover:bg-blue-200"}`}
                    >
                      <BookOpen className={`h-5 w-5 ${!currentDirectoryId ? "text-white" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <span className={`font-semibold ${!currentDirectoryId ? "text-white" : "text-gray-800"}`}>
                        All Exercises
                      </span>
                      <p className={`text-sm ${!currentDirectoryId ? "text-blue-100" : "text-gray-500"}`}>
                        View all your exercises
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={!currentDirectoryId ? "secondary" : "outline"}
                    className={`${!currentDirectoryId ? "bg-white/20 text-white border-white/20" : "bg-blue-100 text-blue-700 border-blue-200"}`}
                  >
                    {getExerciseCount(null)}
                  </Badge>
                </div>

                {/* Use original DirectoryBrowser but with enhanced styling wrapper */}
                <div className="space-y-2">
                  <DirectoryBrowser
                    onExerciseClick={handlePractice}
                    showExercises={true}
                    filterByLanguage={settings.selectedLanguage}
                  />
                </div>
              </div>

              {/* Enhanced Subscription Upgrade Card */}
              {!subscription.isSubscribed && (
                <Card className="mt-6 border-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">Unlock Premium Power</h3>
                        <p className="text-purple-100 text-sm mb-4 leading-relaxed">
                          Create unlimited exercises, edit anytime, and access advanced features to supercharge your
                          learning.
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => navigate("/dashboard/subscription")}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  return (
    <DirectoryProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30" key={key}>
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header with Glassmorphism */}
          <div className="mb-8">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                          {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}{" "}
                          Exercises
                        </h1>
                        <p className="text-gray-600 text-lg">Master your language skills with interactive practice</p>
                      </div>
                    </div>

                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="text-2xl font-bold text-blue-900">{directoryExercises.length}</div>
                            <div className="text-blue-700 text-sm font-medium">Total</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-5 w-5 text-emerald-600" />
                          <div>
                            <div className="text-2xl font-bold text-emerald-900">{completedCount}</div>
                            <div className="text-emerald-700 text-sm font-medium">Mastered</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                          <div>
                            <div className="text-2xl font-bold text-amber-900">{inProgressCount}</div>
                            <div className="text-amber-700 text-sm font-medium">Learning</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-2xl font-bold text-purple-900">{newCount}</div>
                            <div className="text-purple-700 text-sm font-medium">New</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {currentDirectoryId && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                        <Folder className="h-3 w-3 mr-1" />
                        Viewing selected folder
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      disabled={!canCreateMore}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Exercise
                    </Button>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="flex-1"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="flex-1"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Subscription Status Alert */}
            {!subscription.isSubscribed && (
              <Alert className="mt-6 border-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-white shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <AlertDescription className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-6">
                      <div>
                        <span className="font-bold text-lg">Free Plan Active</span>
                        <p className="text-orange-100">Limited to {exerciseLimit} exercises</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-white/20 rounded-full h-3 backdrop-blur-sm">
                          <div
                            className="bg-white h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${Math.min((exercises.length / exerciseLimit) * 100, 100)}%` }}
                          />
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/20 font-bold">
                          {exercises.length}/{exerciseLimit}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => navigate("/dashboard/subscription")}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* Enhanced Directory Browser */}
            <div className="xl:flex-shrink-0">
              <EnhancedDirectoryBrowser />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Default exercises section - only show when not in a directory */}
              {!currentDirectoryId && (
                <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-6">
                    <DefaultExercisesSection />
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Search and filters */}
              <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Search className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Find & Filter</h3>
                      <p className="text-gray-600 text-sm">Search and organize your exercises</p>
                    </div>
                  </div>
                  <FilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    allTags={allTags}
                  />
                </CardContent>
              </Card>

              {filteredExercises.length === 0 ? (
                <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-12">
                    <EmptyStateMessage onCreateExercise={() => (canCreateMore ? setIsAddModalOpen(true) : null)} />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Exercise Grid */}
                  <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Target className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Your Exercises</h3>
                            <p className="text-gray-600 text-sm">{filteredExercises.length} exercises found</p>
                          </div>
                        </div>

                        {/* Results count badge */}
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          Page {currentPage} of {totalPages}
                        </Badge>
                      </div>

                      <ExerciseGrid
                        paginatedExercises={paginatedExercises}
                        exercisesPerPage={exercisesPerPage}
                        onPractice={handlePractice}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onMove={handleMove}
                        onCreateClick={() => setIsAddModalOpen(true)}
                        canEdit={canEdit}
                        viewMode={viewMode}
                      />
                    </CardContent>
                  </Card>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-lg">
                        <CardContent className="p-4">
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals - Always render them but control visibility with open prop */}
        <ExerciseFormModal isOpen={isAddModalOpen} onOpenChange={handleAddModalClose} mode="create" />

        {/* Only render edit modal when there's an exercise to edit */}
        <ExerciseFormModal
          isOpen={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          initialValues={exerciseToEdit}
          mode="edit"
        />

        <DeleteExerciseDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogClose}
          onConfirm={confirmDelete}
        />

        {/* Only render practice modal when there's an exercise to practice */}
        {exerciseToPractice && (
          <PracticeModal
            isOpen={isPracticeModalOpen}
            onOpenChange={handlePracticeModalClose}
            exercise={exerciseToPractice}
            onComplete={handlePracticeComplete}
          />
        )}

        {/* Move exercise modal */}
        {exerciseToMove && (
          <MoveExerciseModal
            isOpen={isMoveModalOpen}
            onOpenChange={handleMoveModalClose}
            exercise={exerciseToMove}
            onSuccess={refreshPage}
          />
        )}
      </div>
    </DirectoryProvider>
  )
}

export default ExercisesPage