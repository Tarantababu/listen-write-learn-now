
import type React from "react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate, useLocation } from "react-router-dom"
import { useAdmin } from "@/hooks/use-admin"
import { VisitorStats } from "@/components/admin/VisitorStats"
import { AdminStatsDashboard } from "@/components/admin/AdminStatsDashboard"
import { FeedbackList } from "@/components/admin/FeedbackList"
import { UserRoleManagement } from "@/components/admin/UserRoleManagement"
import { PromotionalBannerManagement } from "@/components/admin/PromotionalBannerManagement"
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
import BlogManagement from '@/components/admin/BlogManagement';
import FileUploadManagement from '@/components/admin/FileUploadManagement';

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
    <div className="container mx-auto px-4 py-8">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Admin Statistics</h2>
            <AdminStatsDashboard />
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Visitor Analytics</h2>
            <VisitorStats />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Role Management</h2>
            <UserRoleManagement />
          </div>
        </TabsContent>

        <TabsContent value="exercises">
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

        <TabsContent value="feedback">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Feedback</h2>
            <FeedbackList />
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <BlogManagement />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Create New Message</h2>
            <AdminMessagesForm />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Message History</h2>
            <AdminMessagesList />
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Promotional Banner Management</h2>
            <PromotionalBannerManagement />
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">File Upload Management</h2>
            <FileUploadManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage
