
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Notebook, 
  ListChecks, 
  Home, 
  Settings, 
  BookOpen, 
  Headphones,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user } = useAuth();
  
  // Check if user has admin role from the auth state
  const isAdmin = user?.app_metadata?.role === 'admin';

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <ScrollArea className="h-[calc(100vh-10rem)] pr-2">
            <div className="space-y-1">
              <NavLink to="/dashboard" end>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                )}
              </NavLink>
              <NavLink to="/dashboard/exercises">
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    My Exercises
                  </Button>
                )}
              </NavLink>
              <NavLink to="/dashboard/default-exercises">
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Learning Materials
                  </Button>
                )}
              </NavLink>
              <NavLink to="/dashboard/dictation">
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <Headphones className="mr-2 h-4 w-4" />
                    Dictation Practice
                  </Button>
                )}
              </NavLink>
              <NavLink to="/dashboard/settings">
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'} 
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                )}
              </NavLink>

              {isAdmin && (
                <>
                  <div className="mt-6 pt-6 border-t border-border">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                      Admin
                    </h2>
                    <NavLink to="/admin">
                      {({ isActive }) => (
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'} 
                          className="w-full justify-start"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Button>
                      )}
                    </NavLink>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
