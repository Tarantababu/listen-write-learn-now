
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VisitorStats } from '@/components/admin/VisitorStats';
import { AdminStats } from '@/components/admin/AdminStats';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is an admin (match with the email in RLS policy)
  const isAdmin = user?.email === 'yigitaydin@gmail.com';
  
  // If user is not logged in or not an admin, redirect to home
  if (!user || !isAdmin) {
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
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
        <AdminStats />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Visitor Analytics</h2>
        <VisitorStats />
      </div>
    </div>
  );
};

export default AdminPage;
