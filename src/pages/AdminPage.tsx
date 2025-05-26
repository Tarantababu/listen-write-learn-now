import type React from "react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate, useLocation } from "react-router-dom"
import { useAdmin } from "@/hooks/use-admin"
import { VisitorStats } from "@/components/admin/VisitorStats"
import { AdminStatsDashboard } from "@/components/admin/AdminStatsDashboard"
import { FeedbackList } from "@/components/admin/FeedbackList"
import { UserRoleManagement } from "@/components/admin/UserRoleManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DefaultExerciseForm from "@/components/admin/DefaultExerciseForm"
import DefaultExercisesList from "@/components/admin/DefaultExercisesList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminMessagesForm from "@/components/admin/AdminMessagesForm"
import AdminMessagesList from "@/components/admin/AdminMessagesList"
import { useNavigate as useRouterNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import type { BlogPost } from "@/types"
import { useQuery } from "@tanstack/react-query"

const AdminPage: React.FC = () => {
  const { isAdmin, loading } = useAdmin()
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const location = useLocation()

  // Get tab from URL query parameter
  const searchParams = new URLSearchParams(location.search)
  const tabParam = searchParams.get("tab")

  // Set initial active tab based on URL parameter or default to 'default-exercises'
  const [activeTab, setActiveTab] = useState(tabParam || "default-exercises")

  // Update URL when active tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(location.search)
    if (activeTab) {
      newSearchParams.set("tab", activeTab)
      navigate(
        {
          pathname: location.pathname,
          search: newSearchParams.toString(),
        },
        { replace: true },
      )
    }
  }, [activeTab, navigate, location.pathname, location.search])

  // Query to fetch blog posts for the admin panel
  const { data: blogPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data as BlogPost[]
    },
    enabled: activeTab === "blog",
  })

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-center">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // If user is not an admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center mb-4 sm:mb-6">
        <Button variant="outline" size="sm" className="mr-2 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Admin Dashboard</h1>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription className="text-sm">
            Here you can monitor visitor statistics and manage your site
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-8">
        <div className="overflow-x-auto">
          <TabsList className="mb-4 w-max min-w-full grid grid-cols-6 h-auto p-1">
            <TabsTrigger value="default-exercises" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Default Exercises</span>
              <span className="sm:hidden">Exercises</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              Messages
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              Feedback
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              <span className="hidden sm:inline">User Roles</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">
              Blog
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="default-exercises" className="space-y-6 sm:space-y-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Create Default Exercise</h2>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <DefaultExerciseForm />
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Default Exercises</h2>
            <DefaultExercisesList />
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6 sm:space-y-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Create New Message</h2>
            <AdminMessagesForm />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Message History</h2>
            <AdminMessagesList />
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Admin Statistics</h2>
            <AdminStatsDashboard />
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Visitor Analytics</h2>
            <VisitorStats />
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Feedback</h2>
            <FeedbackList />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Role Management</h2>
            <UserRoleManagement />
          </div>
        </TabsContent>

        <TabsContent value="blog">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">Blog Posts</h2>
              <Button onClick={() => routerNavigate("/dashboard/admin/blog/new")} className="w-full sm:w-auto">
                Create New Post
              </Button>
            </div>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : blogPosts && blogPosts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {blogPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => routerNavigate(`/dashboard/admin/blog/edit/${post.id}`)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm sm:text-base truncate">{post.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Status:{" "}
                            <span className={`${post.status === "published" ? "text-green-500" : "text-amber-500"}`}>
                              {post.status === "published" ? "Published" : "Draft"}
                            </span>
                          </p>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
                          {new Date(post.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base">No blog posts yet</p>
                  <Button onClick={() => routerNavigate("/dashboard/admin/blog/new")} className="w-full sm:w-auto">
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage
