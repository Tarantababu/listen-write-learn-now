
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useNavigate } from "react-router-dom";
import { BookOpen, History } from "lucide-react";
import { capitalize } from "@/lib/utils";
import { Language } from "@/types";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { motion } from "framer-motion";

const HomePage = () => {
  const { user } = useAuth();
  const { selectedLanguage, learningLanguages = [] } = useUserSettings();
  const { subscriptionStatus, isSubscriptionLoading } = useSubscription();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Set welcome message based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setWelcomeMessage("Good morning");
    } else if (hour < 18) {
      setWelcomeMessage("Good afternoon");
    } else {
      setWelcomeMessage("Good evening");
    }
  }, []);

  const createRandomExercise = () => {
    navigate('/dashboard/exercises');
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {welcomeMessage}, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Continue your learning journey with {capitalize(selectedLanguage || 'your language')}
        </p>
      </div>

      {/* Language Selection Section */}
      <section className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Your Languages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningLanguages && learningLanguages.length > 0 ? (
            learningLanguages.map((language: Language) => (
              <motion.div
                key={language}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`h-full ${selectedLanguage === language ? 'border-primary' : ''}`}>
                  <CardHeader>
                    <CardTitle className="capitalize">{language}</CardTitle>
                    <CardDescription>
                      {selectedLanguage === language ? "Currently selected" : "Click to select"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Continue practicing and improving your {language} skills.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={selectedLanguage === language ? "default" : "secondary"}
                      className="w-full"
                      onClick={() => navigate('/dashboard/exercises')}
                    >
                      Practice Now
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="col-span-1 md:col-span-3">
              <CardHeader>
                <CardTitle>No languages selected</CardTitle>
                <CardDescription>Add a language to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You haven't selected any languages to learn yet. Visit the settings page to add languages.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => navigate('/dashboard/settings')}
                  className="w-full"
                >
                  Go to Settings
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> New Exercise
              </CardTitle>
              <CardDescription>Start a new exercise in {selectedLanguage || 'your selected language'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Practice reading, listening, and comprehension with new content.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={createRandomExercise} className="w-full">Create Random Exercise</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" /> Recent Activity
              </CardTitle>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your recent exercises and activities to continue your progress.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/dashboard/exercises')} variant="outline" className="w-full">
                View History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
