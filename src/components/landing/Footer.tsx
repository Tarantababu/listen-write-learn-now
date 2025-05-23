import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
export function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Handle anchor links
  const getHref = (anchor: string) => {
    if (isHomePage) {
      return anchor;
    }
    return `/${anchor}`;
  };
  return <footer className="bg-brand-dark text-white">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo className="text-white text-lg" />
            <p className="max-w-xs text-sm text-brand-light">
              Improve your language skills through our unique dictation-based learning approach.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={getHref("#method")} className="text-brand-light hover:text-white transition-colors">
                  Method
                </a>
              </li>
              <li>
                
              </li>
              <li>
                
              </li>
              <li>
                <Link to="/blog" className="text-brand-light hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-brand-light hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-brand-light hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-brand-light hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-brand-light">
                  support@lwlnow.com
                </span>
              </li>
              <li>
                
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-brand-light/20 pt-8 text-center text-sm text-brand-light">
          <p>© {new Date().getFullYear()} lwlnow. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}