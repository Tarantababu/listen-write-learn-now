import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStatsDashboard } from '@/components/admin/AdminStatsDashboard';
import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import { FeedbackList } from '@/components/admin/FeedbackList';
import AdminMessagesList from '@/components/admin/AdminMessagesList';
import AdminMessagesForm from '@/components/admin/AdminMessagesForm';
import DefaultExercisesList from '@/components/admin/DefaultExercisesList';
import DefaultExerciseForm from '@/components/admin/DefaultExerciseForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transformBlogPostsFromDatabase } from '@/utils/blogPostUtils';

const AdminPage: React.FC = () => {
  const [refreshList, setRefreshList] = useState(0);

  const { data: blogPosts = [], isLoading: loadingBlogs } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return transformBlogPostsFromDatabase(data || []);
    }
  });

  const handleExerciseCreated = () => {
    setRefreshList(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your application settings and content</p>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="stats">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="message-form">Send Message</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <AdminStatsDashboard />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Blog Management</CardTitle>
              <CardDescription>
                Create and manage blog posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlogManagement posts={blogPosts} loading={loadingBlogs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Default Exercise</CardTitle>
                <CardDescription>
                  Add new default exercises for all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DefaultExerciseForm onSuccess={handleExerciseCreated} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Exercises</CardTitle>
                <CardDescription>
                  Manage existing default exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DefaultExercisesList key={refreshList} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>
                Review feedback from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>User Messages</CardTitle>
              <CardDescription>
                View all sent messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminMessagesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="message-form">
          <Card>
            <CardHeader>
              <CardTitle>Send Message to Users</CardTitle>
              <CardDescription>
                Create and send messages to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminMessagesForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
