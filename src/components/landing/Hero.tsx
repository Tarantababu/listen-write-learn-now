
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { SampleDictationModal } from './SampleDictationModal';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function Hero() {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  
  const handleOpenSample = () => {
    setSampleModalOpen(true);
  };

  return (
    <section className="relative pt-24 md:pt-36">
      <div
        aria-hidden
        className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
        <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                delayChildren: 1,
              },
            },
          },
          item: {
            hidden: {
              opacity: 0,
              y: 20,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 2,
              },
            },
          },
        }}
        className="absolute inset-0 -z-20">
        <img
          src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
          alt="background"
          className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
          width="3276"
          height="4095"
        />
      </AnimatedGroup>
      <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
      
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
          <AnimatedGroup variants={transitionVariants}>
            <Link
              to="#languages"
              className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
              <span className="text-foreground text-sm">German and English Support</span>
              <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

              <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                </div>
              </div>
            </Link>
            
            <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
              Master a New Language Through Dictation
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-balance text-lg">
              Train your ear, sharpen your memory, and improve your writing—all in one immersive experience.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-md text-muted-foreground">
              Learn German or English by <em>listening and typing what you hear</em>. Designed for learners who want real progress—not just passive exposure.
            </p>
          </AnimatedGroup>

          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                  },
                },
              },
              ...transitionVariants,
            }}
            className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row">
            <div className="bg-foreground/10 rounded-[14px] border p-0.5">
              <Button
                asChild
                size="lg"
                className="rounded-xl px-5 text-base">
                <Link to="/signup">
                  <span className="text-nowrap">Get Started Now</span>
                </Link>
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl px-5"
              onClick={handleOpenSample}>
              <span className="text-nowrap">Try a Sample</span>
            </Button>
          </AnimatedGroup>
        </div>
      </div>

      {/* Sample dictation modal */}
      <SampleDictationModal open={sampleModalOpen} onOpenChange={setSampleModalOpen} />
    </section>
  );
}
