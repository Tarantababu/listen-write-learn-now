
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VisitorStats } from '@/components/admin/VisitorStats';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
      
      <div className="mb-8">
        <VisitorStats />
      </div>
    </div>
  );
};

export default AdminPage;
