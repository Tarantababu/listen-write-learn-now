
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { name: 'Method', href: '/#method' },
  { name: 'Features', href: '/#features' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Blog', href: '/blog' },
];

export function LandingHeader() {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
  
  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-20 w-full px-2">
        <div className={cn(
          'mx-auto mt-2 max-w-6xl px-4 sm:px-6 transition-all duration-300 lg:px-12', 
          isScrolled && 'bg-white/95 max-w-6xl rounded-2xl border shadow-md backdrop-blur-lg lg:px-8'
        )}>
          <div className="relative flex flex-wrap items-center justify-between gap-4 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2">
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                <Menu className={`m-auto size-5 sm:size-6 duration-200 ${menuState ? 'scale-0 opacity-0 rotate-180' : ''}`} />
                <X className={`absolute inset-0 m-auto size-5 sm:size-6 duration-200 ${menuState ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`} />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm font-medium">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {item.href === '/blog' ? (
                      <Link
                        to={item.href}
                        className="text-brand-dark hover:text-brand-primary block duration-150"
                        onClick={handleMenuItemClick}
                      >
                        <span>{item.name}</span>
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-brand-dark hover:text-brand-primary block duration-150"
                        onClick={(e) => handleAnchorClick(e, item.href)}
                      >
                        <span>{item.name}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`bg-white fixed inset-0 top-16 z-10 mb-6 w-full flex-wrap items-start justify-end p-6 pt-10 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none ${menuState ? 'block' : 'hidden'} lg:static lg:flex lg:items-center lg:p-0 lg:shadow-none`}>
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      {item.href === '/blog' ? (
                        <Link
                          to={item.href}
                          className="text-brand-dark hover:text-brand-primary block duration-150"
                          onClick={handleMenuItemClick}
                        >
                          <span>{item.name}</span>
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="text-brand-dark hover:text-brand-primary block duration-150"
                          onClick={(e) => handleAnchorClick(e, item.href)}
                        >
                          <span>{item.name}</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col mt-8 lg:mt-0 space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-brand-primary text-brand-primary hover:bg-brand-primary/10">
                  <Link to="/login">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-secondary">
                  <Link to="/signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
