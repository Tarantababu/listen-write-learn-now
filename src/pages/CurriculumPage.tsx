import type React from "react"
import { useEffect } from "react"
import { useExerciseContext } from "@/contexts/ExerciseContext"
import { useCurriculumExercises } from "@/hooks/use-curriculum-exercises"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Target, TrendingUp, Clock, CheckCircle2, PlayCircle } from "lucide-react"
import UnitAccordion from "@/components/curriculum/UnitAccordion"
import CurriculumSidebar from "@/components/curriculum/CurriculumSidebar"

const CurriculumPage: React.FC = () => {
  const { copyDefaultExercise } = useExerciseContext()
  const { exercisesByTag, stats, loading, selectedLanguage, refreshData } = useCurriculumExercises()
  const navigate = useNavigate()

  // Refresh data when the component mounts
  useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount")
    refreshData()
  }, [refreshData])

  const handlePracticeExercise = async (id: string) => {
    console.log(`Opening practice for exercise with ID: ${id}`)
    // Navigate to exercises page with the exercise ID as a parameter
    navigate(`/dashboard/exercises?defaultExerciseId=${id}&action=practice`)
  }

  const handleAddExercise = async (id: string) => {
    try {
      await copyDefaultExercise(id)
      // After adding, refresh the data to update the exercise status
      refreshData()
      toast.success("Exercise added to your list")
    } catch (error) {
      console.error("Error copying exercise:", error)
      toast.error("Failed to add exercise to your list")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            {/* Enhanced loading animation */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-muted rounded-full animate-spin border-t-primary"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-primary/20"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Loading your learning plan</h3>
              <p className="text-sm text-muted-foreground">Preparing your {selectedLanguage} curriculum...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (Object.keys(exercisesByTag).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto mt-24 border-dashed border-2">
            <CardContent className="text-center py-16 px-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Learning Plan Available</h3>
              <p className="text-muted-foreground mb-6">
                No learning plan exercises are currently available for{" "}
                <Badge variant="secondary">{selectedLanguage}</Badge>.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later or contact support if this seems incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate total lessons and completed lessons across all units
  const totalLessons = stats.total
  const completedLessons = stats.completed
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Filter in-progress exercises
  const inProgressTagMap: Record<string, any[]> = {}
  Object.entries(exercisesByTag).forEach(([tag, exercises]) => {
    const inProgressExercises = exercises.filter((ex) => ex.status === "in-progress")
    if (inProgressExercises.length > 0) {
      inProgressTagMap[tag] = inProgressExercises
    }
  })

  const hasInProgressExercises = Object.keys(inProgressTagMap).length > 0
  const inProgressCount = Object.values(inProgressTagMap).flat().length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Greeting Section */}
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {selectedLanguage} Curriculum
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Your {selectedLanguage} Learning Journey
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Follow our structured curriculum to build your {selectedLanguage} skills step by step. Track your
                progress and master each concept at your own pace.
              </p>

              {/* Progress Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Lessons</p>
                        <p className="text-2xl font-bold">{totalLessons}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{completedLessons}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <p className="text-2xl font-bold">{progressPercentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/3 to-transparent rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="learning-plan" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger
                value="learning-plan"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Learning Plan
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Clock className="w-4 h-4 mr-2" />
                In Progress
                {inProgressCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {inProgressCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="learning-plan" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Units and Lessons */}
              <div className="lg:col-span-2 space-y-6">
                {Object.entries(exercisesByTag).map(([tag, exercises], index) => (
                  <div key={tag} className="transform transition-all duration-200 hover:scale-[1.01]">
                    <UnitAccordion
                      unitNumber={index + 1}
                      title={tag}
                      lessons={exercises}
                      onPracticeExercise={handlePracticeExercise}
                      onAddExercise={handleAddExercise}
                    />
                  </div>
                ))}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <CurriculumSidebar
                    totalLessons={totalLessons}
                    completedLessons={completedLessons}
                    language={selectedLanguage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Units and Lessons */}
              <div className="lg:col-span-2 space-y-6">
                {hasInProgressExercises ? (
                  // Units with in-progress exercises
                  Object.entries(inProgressTagMap).map(([tag, exercises], index) => (
                    <div key={tag} className="transform transition-all duration-200 hover:scale-[1.01]">
                      <UnitAccordion
                        unitNumber={index + 1}
                        title={tag}
                        lessons={exercises}
                        onPracticeExercise={handlePracticeExercise}
                        onAddExercise={handleAddExercise}
                      />
                    </div>
                  ))
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="text-center py-16 px-8">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">No Lessons in Progress</h3>
                      <p className="text-muted-foreground mb-4">You don't have any in-progress lessons yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Start a lesson from the Learning Plan to see it here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <CurriculumSidebar
                    totalLessons={totalLessons}
                    completedLessons={completedLessons}
                    language={selectedLanguage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CurriculumPage
