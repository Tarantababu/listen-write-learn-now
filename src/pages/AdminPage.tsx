
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DefaultExercisesList from "@/components/admin/DefaultExercisesList";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("exercises");
  const [isNewExerciseModalOpen, setIsNewExerciseModalOpen] = useState(false);
  
  useEffect(() => {
    document.title = "Admin Dashboard";
  }, []);
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage content, exercises, and users
        </p>
      </div>
      
      <Tabs defaultValue="exercises" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="exercises">Default Exercises</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          {activeTab === "exercises" && (
            <Button onClick={() => setIsNewExerciseModalOpen(true)} size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Exercise
            </Button>
          )}
        </div>
        
        <TabsContent value="exercises" className="mt-6">
          <DefaultExercisesList />
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">User management features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">Statistics dashboard coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
