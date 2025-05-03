
import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { getLanguageFlag } from '@/utils/languageUtils';
import { Language } from '@/types';

const audiences = [
  {
    title: "Frustrated App Users",
    description: "Learners tired of passive apps that don't deliver real progress"
  },
  {
    title: "Exam Preparers",
    description: "Students preparing for exams like IELTS, TestDaF, or TELC"
  },
  {
    title: "Immigrants & Expats",
    description: "Looking to improve practical, real-world language use"
  },
  {
    title: "Busy Professionals",
    description: "People who want focused, daily practice that fits their schedule"
  }
];

const languages = [
  { code: "english", name: "English" },
  { code: "german", name: "German" },
  { code: "spanish", name: "Spanish" },
  { code: "french", name: "French" },
  { code: "portuguese", name: "Portuguese" },
  { code: "italian", name: "Italian" },
  { code: "turkish", name: "Turkish" },
  { code: "swedish", name: "Swedish" },
  { code: "dutch", name: "Dutch" },
  { code: "norwegian", name: "Norwegian" }
];

export function AudienceSection() {
  return (
    <section id="for-who" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Who It's For</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform is designed for people who want efficient and effective language learning
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
          {audiences.map((audience, i) => (
            <Card key={i} className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{audience.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{audience.description}</p>
              </CardContent>
            </Card>
          ))}
        </AnimatedGroup>
        
        <div className="mt-16 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Language Support</h3>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center gap-2">
                  <div className="size-10 rounded-full flex items-center justify-center">
                    <span className="text-xl">{getLanguageFlag(lang.code as Language)}</span>
                  </div>
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
