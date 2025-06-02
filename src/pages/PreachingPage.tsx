
import React, { useState } from 'react';
import { ArrowLeft, Mic, Target, Trophy, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import PreachingSession from '@/components/preaching/PreachingSession';
import type { PreachingDifficulty } from '@/types/preaching';

const PreachingPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PreachingDifficulty | null>(null);

  const selectedLanguage = settings?.selectedLanguage || 'german';

  const handleStartSession = () => {
    setSessionActive(true);
  };

  const handleDifficultySelect = (difficulty: PreachingDifficulty) => {
    setSelectedDifficulty(difficulty);
    setSessionActive(true);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setSelectedDifficulty(null);
    // Could show completion modal or redirect
  };

  const handleExit = () => {
    setSessionActive(false);
    setSelectedDifficulty(null);
    navigate('/dashboard');
  };

  const getDifficultyDetails = (difficulty: PreachingDifficulty) => {
    switch (difficulty) {
      case 'simple':
        return {
          title: 'Simple',
          description: 'Basic patterns with everyday vocabulary. Perfect for beginners.',
          color: 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100',
          features: ['5 nouns to learn', 'Simple "Das ist..." patterns', '3 speaking exercises'],
          icon: Target
        };
      case 'normal':
        return {
          title: 'Normal',
          description: 'Intermediate patterns with possessive articles and basic verbs.',
          color: 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100',
          features: ['7 nouns to learn', '"Mein/Meine" patterns', '5 speaking exercises'],
          icon: Volume2
        };
      case 'complex':
        return {
          title: 'Complex',
          description: 'Advanced patterns with cases, adjectives, and complex structures.',
          color: 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100',
          features: ['10 nouns to learn', 'Complex case patterns', '7 speaking exercises'],
          icon: Trophy
        };
    }
  };

  if (sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-8">
        <div className="container mx-auto px-4">
          <PreachingSession 
            initialDifficulty={selectedDifficulty || undefined}
            autoStart={!!selectedDifficulty}
            onComplete={handleSessionComplete} 
            onExit={handleExit} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Preaching - Speaking Practice</h1>
            <p className="text-gray-600 mt-1">
              Master {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} through interactive speaking drills
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Feature Introduction */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-6 w-6 text-blue-600" />
                <span>Interactive Language Learning Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                Preaching is a comprehensive speaking-focused training system designed to develop your {selectedLanguage} fluency 
                through structured pattern drills, real-time feedback, and progressive difficulty levels.
              </p>
              
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Learning Process
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Badge className="bg-blue-100 text-blue-800 min-w-fit">1</Badge>
                      <div>
                        <p className="font-medium">Memorizing Phase</p>
                        <p className="text-sm text-gray-600">Learn articles and gender rules for new vocabulary</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <Badge className="bg-green-100 text-green-800 min-w-fit">2</Badge>
                      <div>
                        <p className="font-medium">Testing Phase</p>
                        <p className="text-sm text-gray-600">Practice identifying correct articles with instant feedback</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Badge className="bg-purple-100 text-purple-800 min-w-fit">3</Badge>
                      <div>
                        <p className="font-medium">Speaking Drills</p>
                        <p className="text-sm text-gray-600">Apply knowledge through voice-activated pattern practice</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                      <Badge className="bg-amber-100 text-amber-800 min-w-fit">4</Badge>
                      <div>
                        <p className="font-medium">AI Feedback</p>
                        <p className="text-sm text-gray-600">Receive personalized corrections and improvement tips</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                    Key Benefits
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Build automatic grammar responses</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Develop natural speaking confidence</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">Master gender and article accuracy</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Get real-time pronunciation feedback</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-gray-700">Practice authentic conversation patterns</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Difficulty Level</CardTitle>
              <p className="text-gray-600">Select a difficulty that matches your current {selectedLanguage} level</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {(['simple', 'normal', 'complex'] as PreachingDifficulty[]).map((difficulty) => {
                  const details = getDifficultyDetails(difficulty);
                  const IconComponent = details.icon;
                  
                  return (
                    <Card 
                      key={difficulty} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${details.color}`}
                      onClick={() => handleDifficultySelect(difficulty)}
                    >
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="flex justify-center">
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl">{details.title}</h4>
                            <p className="text-sm mt-2 leading-relaxed">
                              {details.description}
                            </p>
                          </div>
                          <div className="space-y-2 text-left">
                            {details.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <Button className="w-full mt-4" variant="outline">
                            Start {details.title} Level
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Option */}
          <div className="text-center bg-white p-8 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Not sure which level to choose?</h3>
            <p className="text-gray-600 mb-6">
              Start with a general session and the system will adapt to your performance
            </p>
            <Button onClick={handleStartSession} size="lg" className="px-8 py-3">
              Start Adaptive Session
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              ⚠️ Make sure your microphone is enabled for voice input
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreachingPage;
