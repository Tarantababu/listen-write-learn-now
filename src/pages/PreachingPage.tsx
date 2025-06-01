
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PreachingSession from '@/components/preaching/PreachingSession';

const PreachingPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionActive, setSessionActive] = useState(false);

  const handleStartSession = () => {
    setSessionActive(true);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    // Could show completion modal or redirect
  };

  const handleExit = () => {
    setSessionActive(false);
    navigate('/dashboard');
  };

  if (sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-8">
        <div className="container mx-auto px-4">
          <PreachingSession 
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
          <Button variant="outline" size="sm" className="mr-4" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Preaching - Speaking Practice</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Feature Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Master German Through Speaking Practice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Preaching is a speaking-focused pattern drill system designed to improve your German fluency 
                through repetition and real-time feedback. You'll practice gender recognition, sentence patterns, 
                and pronunciation to build automatic language responses.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What You'll Practice:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span><strong>Memorizing Gender:</strong> Learn articles for common German nouns</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span><strong>Testing Gender:</strong> Practice identifying der, die, das with instant feedback</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span><strong>Pattern Drilling:</strong> Speak sentence patterns aloud using voice input</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span><strong>Feedback & Corrections:</strong> Get AI-powered corrections and explanations</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Benefits:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Automate grammar through repetition</li>
                    <li>• Build speaking confidence</li>
                    <li>• Learn article and gender accuracy</li>
                    <li>• Get immediate pronunciation feedback</li>
                    <li>• Practice real-time speaking skills</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Difficulty Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                  <h4 className="font-semibold text-green-700">Simple</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Basic patterns with everyday vocabulary. Perfect for beginners.
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• 5 nouns to learn</li>
                    <li>• Simple "Das ist..." patterns</li>
                    <li>• 3 speaking exercises</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                  <h4 className="font-semibold text-blue-700">Normal</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Intermediate patterns with possessive articles and basic verbs.
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• 7 nouns to learn</li>
                    <li>• "Mein/Meine" patterns</li>
                    <li>• 5 speaking exercises</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                  <h4 className="font-semibold text-red-700">Complex</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Advanced patterns with cases, adjectives, and complex structures.
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• 10 nouns to learn</li>
                    <li>• Complex case patterns</li>
                    <li>• 7 speaking exercises</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="text-center">
            <Button onClick={handleStartSession} size="lg" className="px-8 py-3">
              Start Preaching Session
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Make sure your microphone is enabled for voice input
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreachingPage;
