import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useMedia } from 'react-use'; // Changed from useMediaQuery to useMedia which is the correct hook name
import { 
  BookOpen, 
  Library, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  Home,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Fixed auth hook import path
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { getLanguageFlag } from '@/utils/languageUtils';
import ThemeToggle from './ThemeToggle';
import { useAdmin } from '@/hooks/use-admin';

const Layout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useMedia('(max-width: 768px)'); // Changed from useMediaQuery to useMedia
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { subscription } = useSubscription();
  const { settings } = useUserSettingsContext();
  
  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const activeClasses = "font-medium bg-primary text-primary-foreground hover:bg-primary/90";
  const inactiveClasses = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  const navItems = [
    {
      to: "/dashboard",
      exact: true,
      icon: <Home className="w-5 h-5 mr-2" />,
      label: "Dashboard",
    },
    {
      to: "/dashboard/exercises",
      icon: <BookOpen className="w-5 h-5 mr-2" />,
      label: "Exercises",
    },
    {
      to: "/dashboard/curriculum",
      icon: <Library className="w-5 h-5 mr-2" />,
      label: "Curriculum",
    },
    {
      to: "/dashboard/vocabulary",
      icon: <BookOpen className="w-5 h-5 mr-2" />,
      label: "Vocabulary",
    }
  ];

  const secondaryNavItems = [
    ...(subscription?.isSubscribed === false
      ? [
          {
            to: "/dashboard/subscription",
            icon: <CreditCard className="w-5 h-5 mr-2" />,
            label: "Subscribe",
            highlight: true,
          },
        ]
      : []),
    {
      to: "/dashboard/settings",
      icon: <Settings className="w-5 h-5 mr-2" />,
      label: "Settings",
    },
    ...(isAdmin
      ? [
          {
            to: "/dashboard/admin",
            icon: <Settings className="w-5 h-5 mr-2" />,
            label: "Admin",
          },
        ]
      : []),
  ];

  const renderNavItem = (item: any) => (
    <li key={item.to} className="w-full">
      <NavLink
        to={item.to}
        end={item.exact}
        className={({ isActive }) =>
          `flex items-center rounded-md px-3 py-2 transition-colors ${
            isActive ? activeClasses : inactiveClasses
          } ${item.highlight ? "bg-primary/10 text-primary" : ""}`
        }
      >
        {item.icon}
        {item.label}
      </NavLink>
    </li>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          className="fixed z-50 top-4 right-4 p-2 bg-background border rounded-full shadow-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobile || mobileMenuOpen) && (
          <motion.aside
            initial={isMobile ? { x: -300, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -300, opacity: 0 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-64 bg-card border-r min-h-screen p-4 flex flex-col fixed top-0 bottom-0 z-40 
                        ${isMobile ? "left-0" : ""}`}
          >
            <div className="flex items-center space-x-3 mb-8 h-14 px-2">
              <span role="img" aria-label="language flag" className="text-lg">
                {getLanguageFlag(settings.selectedLanguage)}
              </span>
              <h1 className="text-xl font-bold">LinguaLearn</h1>
            </div>

            <nav className="flex flex-col space-y-1 flex-grow">
              <ul className="space-y-1">
                {navItems.map((item) => renderNavItem(item))}
              </ul>

              <div className="flex-1"></div>

              <ul className="space-y-1 pt-4 border-t mt-4">
                {secondaryNavItems.map((item) => renderNavItem(item))}
              </ul>

              <div className="py-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                <ThemeToggle />
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main
        className={`flex-1 transition-all ${
          !isMobile ? "ml-64" : ""
        } min-h-screen bg-background`}
      >
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
