import type React from "react";
import { useEffect } from "react";
import { useExerciseContext } from "@/contexts/ExerciseContext";
import { useCurriculumExercises } from "@/hooks/use-curriculum-exercises";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle2, PlayCircle } from "lucide-react";
import UnitAccordion from "@/components/curriculum/UnitAccordion";
import CurriculumSidebar from "@/components/curriculum/CurriculumSidebar";
const CurriculumPage: React.FC = () => {
  const {
    copyDefaultExercise
  } = useExerciseContext();
  const {
    exercisesByTag,
    stats,
    loading,
    selectedLanguage,
    refreshData
  } = useCurriculumExercises();
  const navigate = useNavigate();

  // Refresh data when the component mounts
  useEffect(() => {
    console.log("CurriculumPage: Refreshing data on mount");
    refreshData();
  }, [refreshData]);
  const handlePracticeExercise = async (id: string) => {
    console.log(`Opening practice for exercise with ID: ${id}`);
    // Navigate to exercises page with the exercise ID as a parameter
    navigate(`/dashboard/exercises?defaultExerciseId=${id}&action=practice`);
  };
  const handleAddExercise = async (id: string) => {
    try {
      await copyDefaultExercise(id);
      // After adding, refresh the data to update the exercise status
      refreshData();
      toast.success("Exercise added to your list");
    } catch (error) {
      console.error("Error copying exercise:", error);
      toast.error("Failed to add exercise to your list");
    }
  };
  if (loading) {
    return <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading curriculum...</p>
        </div>
      </div>;
  }
  if (Object.keys(exercisesByTag).length === 0) {
    return <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">No exercises available</h3>
            <p className="text-muted-foreground">No learning plan exercises found for {selectedLanguage}.</p>
          </div>
        </div>
      </div>;
  }

  // Calculate total lessons and completed lessons across all units
  const totalLessons = stats.total;
  const completedLessons = stats.completed;
  const progressPercentage = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0;

  // Filter in-progress exercises
  const inProgressTagMap: Record<string, any[]> = {};
  Object.entries(exercisesByTag).forEach(([tag, exercises]) => {
    const inProgressExercises = exercises.filter(ex => ex.status === "in-progress");
    if (inProgressExercises.length > 0) {
      inProgressTagMap[tag] = inProgressExercises;
    }
  });
  const hasInProgressExercises = Object.keys(inProgressTagMap).length > 0;
  const inProgressCount = Object.values(inProgressTagMap).flat().length;
  return <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      

      {/* Tabs */}
      <Tabs defaultValue="learning-plan" className="space-y-8">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="learning-plan" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learning Plan
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            In Progress
            {inProgressCount > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                {inProgressCount}
              </Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning-plan" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {Object.entries(exercisesByTag).map(([tag, exercises], index) => <UnitAccordion key={tag} unitNumber={index + 1} title={tag} lessons={exercises} onPracticeExercise={handlePracticeExercise} onAddExercise={handleAddExercise} />)}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <CurriculumSidebar totalLessons={totalLessons} completedLessons={completedLessons} language={selectedLanguage} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {hasInProgressExercises ? Object.entries(inProgressTagMap).map(([tag, exercises], index) => <UnitAccordion key={tag} unitNumber={index + 1} title={tag} lessons={exercises} onPracticeExercise={handlePracticeExercise} onAddExercise={handleAddExercise} />) : <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                      <h3 className="font-medium">No lessons in progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a lesson from the Learning Plan to see it here.
                      </p>
                    </div>
                  </CardContent>
                </Card>}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <CurriculumSidebar totalLessons={totalLessons} completedLessons={completedLessons} language={selectedLanguage} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};
export default CurriculumPage;