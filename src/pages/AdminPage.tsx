
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { VisitorStats } from '@/components/admin/VisitorStats';
import { AdminStatsDashboard } from '@/components/admin/AdminStatsDashboard';
import { FeedbackList } from '@/components/admin/FeedbackList';
import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DefaultExerciseForm from '@/components/admin/DefaultExerciseForm';
import DefaultExercisesList from '@/components/admin/DefaultExercisesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminMessagesForm from '@/components/admin/AdminMessagesForm';
import AdminMessagesList from '@/components/admin/AdminMessagesList';
import BlogPostEditor from '@/components/blog/admin/BlogPostEditor';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types';
import { useQuery } from '@tanstack/react-query';

const AdminPage: React.FC = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const [activeTab, setActiveTab] = useState('default-exercises');
  
  // Query to fetch blog posts for the admin panel
  const { data: blogPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: activeTab === 'blog'
  });
  
  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[80vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }
  
  // If user is not an admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>
            Here you can monitor visitor statistics and manage your site
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="default-exercises">Default Exercises</TabsTrigger>
          <TabsTrigger value="messages">User Messages</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="users">User Roles</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="default-exercises" className="space-y-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Create Default Exercise</h2>
            <Card>
              <CardContent className="pt-6">
                <DefaultExerciseForm />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Default Exercises</h2>
            <DefaultExercisesList />
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Message</h2>
            <AdminMessagesForm />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Message History</h2>
            <AdminMessagesList />
          </div>
        </TabsContent>
        
        <TabsContent value="statistics">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Admin Statistics</h2>
            <AdminStatsDashboard />
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Visitor Analytics</h2>
            <VisitorStats />
          </div>
        </TabsContent>
        
        <TabsContent value="feedback">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">User Feedback</h2>
            <FeedbackList />
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
            <UserRoleManagement />
          </div>
        </TabsContent>

        <TabsContent value="blog">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Blog Posts</h2>
              <Button onClick={() => routerNavigate('/dashboard/admin/blog/new')}>
                Create New Post
              </Button>
            </div>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : blogPosts && blogPosts.length > 0 ? (
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <Card key={post.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => routerNavigate(`/dashboard/admin/blog/edit/${post.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Status: <span className={`${post.status === 'published' ? 'text-green-500' : 'text-amber-500'}`}>
                              {post.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No blog posts yet</p>
                  <Button onClick={() => routerNavigate('/dashboard/admin/blog/new')}>
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
