
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, LogOut, User, Settings, BookOpen, ListChecks, Headphones, Home } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { settings } = useUserSettingsContext();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header className={cn(
        'sticky top-0 z-40 w-full backdrop-blur-sm transition-all duration-200',
        isScrolled ? 'bg-background/95 border-b' : 'bg-background/60'
      )}>
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6" />
              <span className="ml-2 text-xl font-bold">LingoTrack</span>
            </div>
          </Link>

          {user ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link to="/dashboard/exercises" className="text-sm font-medium transition-colors hover:text-primary">
                  My Exercises
                </Link>
                <Link to="/dashboard/default-exercises" className="text-sm font-medium transition-colors hover:text-primary">
                  Learning Path
                </Link>
              </nav>
              
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate('/dashboard/settings')}>
                  <AvatarImage src={settings.avatarUrl} />
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={toggleMenu} className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="hidden sm:flex space-x-2">
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Log In
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleMenu} className="sm:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Dialog */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 h-[100dvh]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6" />
                <span className="ml-2 text-xl font-bold">LingoTrack</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-grow p-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-2 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={settings.avatarUrl} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}</p>
                    </div>
                  </div>
                  
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <Home className="mr-3 h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/dashboard/exercises" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <ListChecks className="mr-3 h-5 w-5" />
                    <span>My Exercises</span>
                  </Link>
                  <Link to="/dashboard/default-exercises" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <BookOpen className="mr-3 h-5 w-5" />
                    <span>Learning Path</span>
                  </Link>
                  <Link to="/dashboard/dictation" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <Headphones className="mr-3 h-5 w-5" />
                    <span>Dictation Practice</span>
                  </Link>
                  <Link to="/dashboard/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <Settings className="mr-3 h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <div className="border-t my-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center p-2 text-destructive hover:bg-muted rounded-lg"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <User className="mr-3 h-5 w-5" />
                    <span>Log In</span>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center p-2 hover:bg-muted rounded-lg">
                    <User className="mr-3 h-5 w-5" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
