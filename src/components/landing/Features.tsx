
import React from 'react';
import { Check, Ear, Brain, Pen, ArrowUpRight, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatedGroup } from '@/components/ui/animated-group';

const features = [
  {
    icon: <Ear className="h-10 w-10 text-primary" />,
    title: "Listening",
    description: "Improve comprehension with natural, everyday speech.",
    className: "bg-purple-50 dark:bg-purple-950/20"
  },
  {
    icon: <Pen className="h-10 w-10 text-primary" />,
    title: "Writing",
    description: "Reinforce grammar, spelling, and punctuation.",
    className: "bg-blue-50 dark:bg-blue-950/20"
  },
  {
    icon: <Brain className="h-10 w-10 text-primary" />,
    title: "Memory",
    description: "Build active recall with spaced repetition and context-based learning.",
    className: "bg-amber-50 dark:bg-amber-950/20"
  },
  {
    icon: <FileBarChart className="h-10 w-10 text-primary" />,
    title: "Progress",
    description: "Track your accuracy and speed over time.",
    className: "bg-green-50 dark:bg-green-950/20"
  }
];

const benefits = [
  "Native-speaker audio at beginner to advanced levels",
  "Comprehension-friendly texts based on the most common 1000–7000 words",
  "Instant feedback and error highlighting",
  "Smart statistics to monitor your progress",
  "Multilingual support (German, English, Turkish)",
  "Free access with optional premium features coming soon"
];

export function Features() {
  return (
    <>
      <section id="features" className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why Dictation Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Dictation is a time-tested method that strengthens all core language skills at once:
              </p>
            </div>
          </div>
          
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              },
              item: {
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                  },
                },
              },
            }}
            className="mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
            {features.map((feature, i) => (
              <Card key={i} className={cn("border shadow-sm", feature.className)}>
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </AnimatedGroup>
        </div>
      </section>
      
      <section id="how-it-works" className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What You'll Get</h2>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-6 w-6 text-primary mt-1 shrink-0" /> 
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-lg">
                <div className="p-4 sm:p-6">
                  <img
                    src="https://ik.imagekit.io/lrigu76hy/tailark/dictation-app-mockup.png?updatedAt=1745733451120"
                    alt="Application interface showing dictation exercise"
                    className="rounded-lg border shadow-sm"
                    width="500"
                    height="350"
                  />
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Interactive Dictation</h3>
                      <p className="text-sm text-muted-foreground">Type what you hear and get instant feedback</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
