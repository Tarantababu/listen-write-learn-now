
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { isAuthenticated, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link to="/" className="text-xl font-bold">
          Language Learning
        </Link>
        
        <nav>
          <ul className="flex gap-6 items-center">
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/exercises" className="hover:underline">
                    Exercises
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/roadmap" className="hover:underline">
                    Learning Path
                  </Link>
                </li>
                <li>
                  <Button variant="ghost" onClick={signOut}>
                    Sign Out
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="hover:underline">
                    Log In
                  </Link>
                </li>
                <li>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
