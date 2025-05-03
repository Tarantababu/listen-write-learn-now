
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Headphones, 
  Menu, 
  LogOut, 
  BookOpen, 
  Home, 
  Settings, 
  CreditCard,
  Crown
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getLanguageFlag } from '@/utils/languageUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserAvatar from './UserAvatar';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { settings } = useUserSettingsContext();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path 
      || (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const languageFlag = getLanguageFlag(settings.selectedLanguage);

  return (
    <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur h-16">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Headphones className="h-5 w-5 text-action-blue" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-action-blue to-primary hidden sm:inline-block">
              ListenWriteLearn
            </span>
          </Link>
          
          {!isMobile && user && (
            <nav className="flex items-center gap-1">
              <Button 
                asChild 
                variant={isActive('/dashboard') && !isActive('/dashboard/exercises') && !isActive('/dashboard/vocabulary') ? "default" : "ghost"}
                className="transition-all"
                size="sm"
              >
                <Link to="/dashboard">
                  <Home className="h-5 w-5 mr-1" />
                  Dashboard
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant={isActive('/dashboard/exercises') ? "default" : "ghost"}
                className="transition-all"
                size="sm"
              >
                <Link to="/dashboard/exercises">
                  <BookOpen className="h-5 w-5 mr-1" />
                  Exercises
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant={isActive('/dashboard/vocabulary') ? "default" : "ghost"}
                className="transition-all"
                size="sm"
              >
                <Link to="/dashboard/vocabulary">
                  <BookOpen className="h-5 w-5 mr-1" />
                  Vocabulary
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant={isActive('/dashboard/subscription') ? "default" : "ghost"}
                className="transition-all"
                size="sm"
              >
                <Link to="/dashboard/subscription">
                  <CreditCard className="h-5 w-5 mr-1" />
                  Subscription
                </Link>
              </Button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center h-8 w-8 text-lg animate-fade-in hover:scale-110 transition-transform">
                    {languageFlag}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Selected language: {settings.selectedLanguage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {user ? (
            <>
              {subscription.isSubscribed && (
                <span className="hidden sm:flex items-center text-xs font-medium bg-action-blue/15 text-action-blue px-2 py-1 rounded animate-fade-in">
                  <Crown className="h-4 w-4 mr-1" />
                  Premium
                </span>
              )}
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 h-8 w-8">
                    {isMobile ? <Menu className="h-5 w-5" /> : <UserAvatar size="sm" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isMobile && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">
                          <Home className="h-5 w-5 mr-2" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/exercises">
                          <BookOpen className="h-5 w-5 mr-2" /> Exercises
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/vocabulary">
                          <BookOpen className="h-5 w-5 mr-2" /> Vocabulary
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/subscription">
                          <CreditCard className="h-5 w-5 mr-2" /> Subscription
                          {subscription.isSubscribed && (
                            <Crown className="h-4 w-4 ml-1 text-action-blue" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">
                      <Settings className="h-5 w-5 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-5 w-5 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="transition-all">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="transition-all">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
