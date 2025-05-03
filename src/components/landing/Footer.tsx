
import React from 'react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t bg-accent-beige/40">
      <div className="container px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo className="text-lg" />
            <p className="max-w-xs text-sm text-primary-gray/70">
              Improve your language skills through our unique dictation-based learning approach.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-primary-gray">Platform</h3>
            <ul className="space-y-2 text-caption">
              <li>
                <a href="#features" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#for-who" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  Who It's For
                </a>
              </li>
              <li>
                <a href="#about" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-primary-gray">Languages</h3>
            <ul className="space-y-2 text-caption">
              <li>
                <a href="#" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  German
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  English
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-primary-gray">Legal</h3>
            <ul className="space-y-2 text-caption">
              <li>
                <a href="#" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-gray/70 hover:text-action-blue transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-caption text-primary-gray/70">
          <p>© {new Date().getFullYear()} ListenWriteLearn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
