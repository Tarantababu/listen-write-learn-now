
import React from 'react';

export function VideoExplanation() {
  return (
    <section id="method" className="py-16 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-brand-dark">See How It Works</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch our quick demo to see how lwlnow helps you master languages through dictation
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden border shadow-lg">
          <div className="aspect-video w-full">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://youtu.be/sExupd54k2c" 
              title="How to Use the lwlnow – Full Guide for Language Learners | Get Started Today!" 
              frameBorder="0" 
              referrerPolicy="unsafe-url" 
              allowFullScreen={true} 
              allow="clipboard-write" 
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-forms allow-same-origin allow-presentation" 
              className="w-full h-full"
              style={{ borderRadius: '10px' }}
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
