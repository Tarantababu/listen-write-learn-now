
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Handle anchor links
  const getHref = (anchor: string) => {
    if (isHomePage) {
      return anchor; // Just use #method, #how-it-works, etc.
    }
    return `/${anchor}`; // If not on homepage, use /#method, /#how-it-works, etc.
  };

  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo className="text-lg" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Improve your language skills through our unique dictation-based learning approach.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={getHref("#method")} className="text-muted-foreground hover:text-foreground transition-colors">
                  Method
                </a>
              </li>
              <li>
                <a href={getHref("#how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href={getHref("#tools")} className="text-muted-foreground hover:text-foreground transition-colors">
                  Tools
                </a>
              </li>
              <li>
                <a href={getHref("#why-it-works")} className="text-muted-foreground hover:text-foreground transition-colors">
                  Why It Works
                </a>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">
                  support@lwlnow.com
                </span>
              </li>
              <li>
                <a 
                  href="https://twitter.com/lwlnow" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} lwlnow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
