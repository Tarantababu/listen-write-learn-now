
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Language Learning</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Improve your language skills through personalized learning paths and interactive exercises.
      </p>
      
      {isAuthenticated ? (
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard/roadmap">View Learning Path</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
