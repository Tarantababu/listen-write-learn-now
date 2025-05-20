import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeToggle } from './ModeToggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home } from 'lucide-react';
import { OnboardingTour } from './onboarding/OnboardingTour';

const Header = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:w-80 p-0">
              <ScrollArea className="h-full">
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Navigate the application
                  </SheetDescription>
                </SheetHeader>
                <Separator />
                <div className="flex flex-col gap-2 py-4 px-3">
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard/exercises">
                      Exercises
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard/vocabulary">
                      Vocabulary
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard/curriculum">
                      Curriculum
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard/tutorial">
                      Tutorial
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard/settings">
                      Settings
                    </Link>
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-col gap-2 py-4 px-3">
                  <ModeToggle />
                  <Button variant="ghost" className="justify-start" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        ) : null}
        
        <div className="flex items-center justify-between flex-1 gap-2">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 mr-4" data-onboarding="dashboard">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/android-chrome-192x192.png" alt={user?.email || "Avatar"} />
                <AvatarFallback>
                  {user?.email ? user.email[0].toUpperCase() : <Skeleton />}
                </AvatarFallback>
              </Avatar>
              <span className="font-bold">lwlnow</span>
            </Link>

            {/* Main Navigation Links - Desktop Only */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                to="/dashboard/exercises"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  location.pathname.includes('/dashboard/exercises')
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
                data-onboarding="exercises"
              >
                Exercises
              </Link>
              <Link
                to="/dashboard/vocabulary"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  location.pathname.includes('/dashboard/vocabulary')
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
                data-onboarding="vocabulary"
              >
                Vocabulary
              </Link>
              <Link
                to="/dashboard/curriculum"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  location.pathname.includes('/dashboard/curriculum')
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
              >
                Curriculum
              </Link>
              <Link
                to="/dashboard/tutorial"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  location.pathname.includes('/dashboard/tutorial')
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
              >
                Tutorial
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" data-onboarding="settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
