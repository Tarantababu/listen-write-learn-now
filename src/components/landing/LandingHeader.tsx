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
  
  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="w-full px-2">
        <div className="mx-auto mt-2 max-w-6xl px-4 sm:px-6 lg:px-12">
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
                <div className="hidden lg:block">
                  <LanguageSelector />
                </div>
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
                  <Link to="/language-selection">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <div className="lg:hidden">
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}