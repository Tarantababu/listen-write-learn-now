
import React from 'react';

export function VideoExplanation() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">See How It Works</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch our quick demo to see how ListenWriteLearn helps you master languages through dictation
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden border shadow-lg">
          <div className="aspect-video w-full">
            <iframe
              src="https://app.guidde.com/share/playbooks/soJN2AGizD8NwNKcTTmJT1?origin=S7lSOMG6LUYxSkWdTvKHDQF8FdF2"
              className="w-full h-full"
              title="ListenWriteLearn Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
