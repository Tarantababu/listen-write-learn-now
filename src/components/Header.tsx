import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAdmin } from '@/hooks/use-admin';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, BookOpen, Home, Settings, CreditCard, Crown, LayoutDashboard, Book, Shield, HelpCircle, GraduationCap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import { UserMessages } from '@/components/UserMessages';
import ThemeToggle from './ThemeToggle';
import { Logo } from './landing/Logo';
import { StreakIndicator } from './StreakIndicator';
import { LanguageSelectionDropdown } from './LanguageSelectionDropdown';
const Header: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
  const {
    subscription
  } = useSubscription();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isActive = (path: string) => {
    return location.pathname === path || path !== '/dashboard' && location.pathname.startsWith(path);
  };
  return <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <Logo />
          </Link>
          
          {!isMobile && user && <nav className="flex items-center gap-1">
              <Button asChild variant={isActive('/dashboard') && !isActive('/dashboard/exercises') && !isActive('/dashboard/vocabulary') && !isActive('/dashboard/curriculum') ? "default" : "ghost"} size="sm" className="transition-all">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              
              <Button asChild variant={isActive('/dashboard/curriculum') ? "default" : "ghost"} size="sm" className="transition-all">
                <Link to="/dashboard/curriculum">
                  <GraduationCap className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Learning Plan</span>
                </Link>
              </Button>
              
              <Button asChild variant={isActive('/dashboard/exercises') ? "default" : "ghost"} size="sm" className="transition-all">
                <Link to="/dashboard/exercises">
                  <BookOpen className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Exercises</span>
                </Link>
              </Button>
              
              <Button asChild variant={isActive('/dashboard/vocabulary') ? "default" : "ghost"} size="sm" className="transition-all">
                <Link to="/dashboard/vocabulary">
                  <Book className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">My Vocabulary</span>
                </Link>
              </Button>
              
              {isAdmin && <Button asChild variant={isActive('/dashboard/admin') ? "default" : "ghost"} size="sm" className="transition-all bg-amber-500/10 hover:bg-amber-500/20">
                  <Link to="/dashboard/admin">
                    <Shield className="h-4 w-4 sm:mr-1 text-amber-500" />
                    <span className="hidden sm:inline text-amber-500">Admin</span>
                  </Link>
                </Button>}
            </nav>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add StreakIndicator for logged-in users */}
          {user && <StreakIndicator />}
          
          {/* Language Selection Dropdown for logged-in users */}
          {user && <LanguageSelectionDropdown />}
          
          {/* Theme Toggle Added Here */}
          <ThemeToggle variant="compact" showLabel={false} />
          
          {user ? <>
              {subscription.isSubscribed && <span className="hidden sm:flex items-center text-xs font-medium bg-primary/15 text-primary px-2 py-1 rounded animate-fade-in">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </span>}
              
              {/* Add UserMessages component here */}
              <UserMessages />
              
              {/* Admin quick access button */}
              {isAdmin && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="ghost" size="icon" className="rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Admin Dashboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>}
              
              {/* User dropdown menu */}
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserAvatar />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={cn("z-50 min-w-[12rem] bg-background border border-border overflow-hidden rounded-md shadow-md", "animate-in fade-in-80")}>
                  {isMobile && <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center w-full">
                          <Home className="h-4 w-4 mr-2" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/curriculum" className="flex items-center w-full">
                          <GraduationCap className="h-4 w-4 mr-2" /> Learning Plan
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/exercises" className="flex items-center w-full">
                          <BookOpen className="h-4 w-4 mr-2" /> Exercises
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/vocabulary" className="flex items-center w-full">
                          <Book className="h-4 w-4 mr-2" /> Vocabulary
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && <DropdownMenuItem asChild>
                          <Link to="/dashboard/admin" className="flex items-center w-full">
                            <Shield className="h-4 w-4 mr-2 text-amber-500" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>}
                      <DropdownMenuSeparator />
                    </>}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings" className="flex items-center w-full">
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/subscription" className="flex items-center w-full">
                      <CreditCard className="h-4 w-4 mr-2" /> Subscription
                      {subscription.isSubscribed && <Crown className="h-3 w-3 ml-1 text-primary" />}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/tutorial" className="flex items-center w-full">
                      <HelpCircle className="h-4 w-4 mr-2" /> Tutorial
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center w-full">
                    <LogOut className="h-4 w-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <>
              <Button asChild variant="ghost" className="transition-all text-sm" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="transition-all text-sm" size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>}
        </div>
      </div>
    </header>;
};
export default Header;