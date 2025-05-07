
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../landing/Footer';
import { LandingHeader } from '../landing/LandingHeader';

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      
      <main className="flex-grow container max-w-3xl px-4 py-12">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-8">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
        
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm mb-8">Last Updated: {lastUpdated}</p>
          
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
