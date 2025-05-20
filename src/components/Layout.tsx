import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Home, BookOpen, ListChecks, GraduationCap, Settings, HelpCircle } from 'lucide-react';
import { OnboardingTour } from './onboarding/OnboardingTour';

const Layout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Define navigation items with labels, icons, and paths
  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Exercises', icon: BookOpen, path: '/dashboard/exercises' },
    { label: 'Vocabulary', icon: ListChecks, path: '/dashboard/vocabulary' },
    { label: 'Curriculum', icon: GraduationCap, path: '/dashboard/curriculum' },
    { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
    { label: 'Tutorial', icon: HelpCircle, path: '/dashboard/tutorial' },
  ];

  // Function to determine if a nav item is active based on the current path
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar component with onClick navigation handlers */}
        <Sidebar>
          <div className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
                      isActive(item.path) ? "bg-secondary text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="mr-2.5 h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Sidebar>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      {/* Add OnboardingTour component */}
      <OnboardingTour />
    </div>
  );
};

export default Layout;
