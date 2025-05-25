import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSelector } from './LanguageSelector';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { name: 'Method', href: '/#method' },
  { name: 'Blog', href: '/blog' },
];

export function LandingHeader() {
  const [menuState, setMenuState] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Close the menu when clicking a menu item
  const handleMenuItemClick = () => {
    if (menuState) {
      setMenuState(false);
    }
  };

  // Handle anchor links or redirects
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isHomePage && href.startsWith('/#')) {
      e.preventDefault();
      const id = href.substring(2);
      const element = document.getElementById(id);
      
      if (element) {
        window.scrollTo({
          top: element.offsetTop - 100,
          behavior: 'smooth'
        });
        handleMenuItemClick();
      }
    }
  };

  // Handle outside click to close menu
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setMenuState(false);
    }
  };

  // Handle escape key to close menu
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuState) {
        setMenuState(false);
      }
    };
    
    if (menuState) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [menuState]);
  
  return (
    <header style={{ backgroundColor: '#FCFCFD' }}>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="w-full px-2"
        style={{ backgroundColor: '#FCFCFD' }}>
        <div className="container mx-auto px-4 py-4 md:px-6 lg:py-5">
          <div className="relative flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              aria-label="home"
              className="flex items-center space-x-2 transition-opacity duration-200 hover:opacity-80">
              <Logo />
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState ? 'Close Menu' : 'Open Menu'}
              aria-expanded={menuState}
              className="relative z-30 -m-2.5 -mr-2 block cursor-pointer p-2.5 transition-colors duration-200 hover:bg-black/5 rounded-lg lg:hidden">
              <Menu className={`m-auto size-5 sm:size-6 transition-all duration-300 ${menuState ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}`} />
              <X className={`absolute inset-0 m-auto size-5 sm:size-6 transition-all duration-300 ${menuState ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`} />
            </button>

            {/* Desktop Actions */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              <div className="transition-transform duration-200 hover:scale-105">
                <LanguageSelector />
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 transition-all duration-200 hover:scale-105">
                <Link to="/login">
                  <span>Login</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-brand-primary hover:bg-brand-secondary transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg">
                <Link to="/language-selection">
                  <span>Sign Up</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 z-20 transition-all duration-300 ${menuState ? 'visible opacity-100' : 'invisible opacity-0'} lg:hidden`}
          onClick={handleOverlayClick}
          style={{ 
            background: menuState ? 'linear-gradient(to bottom, #FCFCFD 0%, #FCFCFD 70%, rgba(252, 252, 253, 0.98) 100%)' : 'transparent',
            backdropFilter: menuState ? 'blur(8px)' : 'none'
          }}>
          <div 
            className={`w-full max-w-sm ml-auto h-full flex flex-col transition-transform duration-300 ${menuState ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ backgroundColor: '#FCFCFD' }}>
            
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <span className="text-lg font-medium text-brand-dark">Menu</span>
              <button
                onClick={() => setMenuState(false)}
                aria-label="Close Menu"
                className="p-2 rounded-lg hover:bg-black/5 transition-colors duration-200">
                <X className="size-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <ul className="p-6 space-y-4">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {item.href === '/blog' ? (
                      <Link
                        to={item.href}
                        className="text-brand-dark hover:text-brand-primary block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-brand-primary/5 text-base font-medium"
                        onClick={handleMenuItemClick}
                      >
                        <span>{item.name}</span>
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-brand-dark hover:text-brand-primary block py-3 px-4 rounded-lg transition-all duration-200 hover:bg-brand-primary/5 text-base font-medium"
                        onClick={(e) => handleAnchorClick(e, item.href)}
                      >
                        <span>{item.name}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Menu Footer Actions */}
            <div className="p-6 border-t border-gray-100 space-y-4">
              <div className="flex flex-col space-y-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-brand-primary text-brand-primary hover:bg-brand-primary/10 transition-all duration-200 w-full">
                  <Link to="/login" onClick={handleMenuItemClick}>
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-secondary transition-all duration-200 w-full shadow-md">
                  <Link to="/language-selection" onClick={handleMenuItemClick}>
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}