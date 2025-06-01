import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Volume2, Brain, Target, Zap, Award, CheckCircle, Play } from 'lucide-react';

const PreachingPage = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check microphone permissions
  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophoneEnabled(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setMicrophoneEnabled(false);
      }
    };
    checkMicrophone();
  }, []);

  const handleStartSession = () => {
    if (!selectedDifficulty) return;
    setIsAnimating(true);
    setTimeout(() => {
      setSessionActive(true);
      setIsAnimating(false);
    }, 500);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setSelectedDifficulty(null);
  };

  const handleExit = () => {
    setSessionActive(false);
    setSelectedDifficulty(null);
  };

  const difficulties = [
    {
      id: 'simple',
      name: 'Simple',
      color: 'green',
      gradient: 'from-green-400 to-emerald-500',
      bgHover: 'hover:bg-green-50',
      borderColor: 'border-green-200',
      description: 'Basic patterns with everyday vocabulary. Perfect for beginners.',
      features: ['5 nouns to learn', 'Simple "Das ist..." patterns', '3 speaking exercises'],
      icon: Target,
      estimatedTime: '10-15 minutes'
    },
    {
      id: 'normal',
      name: 'Normal',
      color: 'blue',
      gradient: 'from-blue-400 to-cyan-500',
      bgHover: 'hover:bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Intermediate patterns with possessive articles and basic verbs.',
      features: ['7 nouns to learn', '"Mein/Meine" patterns', '5 speaking exercises'],
      icon: Brain,
      estimatedTime: '15-20 minutes'
    },
    {
      id: 'complex',
      name: 'Complex',
      color: 'purple',
      gradient: 'from-purple-400 to-pink-500',
      bgHover: 'hover:bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Advanced patterns with cases, adjectives, and complex structures.',
      features: ['10 nouns to learn', 'Complex case patterns', '7 speaking exercises'],
      icon: Zap,
      estimatedTime: '20-30 minutes'
    }
  ];

  if (sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-8">
        <div className="container mx-auto px-4">
          {/* Placeholder for PreachingSession component */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Preaching Session Active</h2>
            <p className="text-gray-600 mb-6">Session would start here with difficulty: {selectedDifficulty}</p>
            <div className="space-x-4">
              <button
                onClick={handleSessionComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Session
              </button>
              <button
                onClick={handleExit}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Preaching
            </h1>
            <p className="text-gray-600 mt-1">Master German through speaking practice</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Volume2 className="h-8 w-8 mr-3" />
                <h2 className="text-3xl font-bold">Speaking-Focused Pattern Drills</h2>
              </div>
              <p className="text-lg opacity-90 max-w-3xl leading-relaxed">
                Build automatic German responses through repetition and real-time feedback. Practice gender recognition, 
                sentence patterns, and pronunciation to develop natural fluency.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: "Memory Building", desc: "Automate grammar through repetition" },
              { icon: Mic, title: "Speaking Confidence", desc: "Practice with voice recognition" },
              { icon: Target, title: "Gender Accuracy", desc: "Master der, die, das articles" },
              { icon: Award, title: "Instant Feedback", desc: "Get AI-powered corrections" }
            ].map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Difficulty Selection */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Difficulty Level</h2>
              <p className="text-gray-600">Select the level that matches your current German proficiency</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {difficulties.map((level) => {
                const IconComponent = level.icon;
                const isSelected = selectedDifficulty === level.id;
                
                return (
                  <div
                    key={level.id}
                    onClick={() => setSelectedDifficulty(level.id)}
                    className={`relative cursor-pointer p-6 border-2 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                      isSelected 
                        ? `${level.borderColor} bg-gradient-to-br from-white to-${level.color}-50 shadow-md` 
                        : `border-gray-200 ${level.bgHover}`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div className="flex items-center mb-4">
                      <div className={`bg-gradient-to-r ${level.gradient} w-10 h-10 rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <h3 className={`text-xl font-bold text-${level.color}-700`}>{level.name}</h3>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">{level.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {level.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <div className={`w-1.5 h-1.5 bg-${level.color}-400 rounded-full mr-2`}></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <div className={`text-xs font-medium text-${level.color}-600 bg-${level.color}-50 px-3 py-1 rounded-full inline-block`}>
                      ⏱️ {level.estimatedTime}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Microphone Status */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mic className={`h-5 w-5 mr-2 ${microphoneEnabled ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="font-medium">
                    Microphone: {microphoneEnabled ? 'Ready' : 'Not Available'}
                  </span>
                </div>
                {!microphoneEnabled && (
                  <button className="text-blue-600 text-sm hover:underline">
                    Enable Microphone
                  </button>
                )}
              </div>
              {!microphoneEnabled && (
                <p className="text-sm text-gray-600 mt-2">
                  Voice input is required for speaking practice. Please allow microphone access.
                </p>
              )}
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={handleStartSession}
                disabled={!selectedDifficulty || !microphoneEnabled || isAnimating}
                className={`relative px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform ${
                  selectedDifficulty && microphoneEnabled && !isAnimating
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  {isAnimating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="h-5 w-5 mr-2" />
                  )}
                  {isAnimating ? 'Starting Session...' : 'Start Preaching Session'}
                </div>
              </button>
              
              {!selectedDifficulty && (
                <p className="text-sm text-gray-500 mt-3">
                  Please select a difficulty level to continue
                </p>
              )}
              {selectedDifficulty && !microphoneEnabled && (
                <p className="text-sm text-red-500 mt-3">
                  Microphone access required for voice practice
                </p>
              )}
              {selectedDifficulty && microphoneEnabled && (
                <p className="text-sm text-gray-500 mt-3">
                  Ready to start your {selectedDifficulty} level session
                </p>
              )}
            </div>
          </div>

          {/* Learning Steps Preview */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Your Learning Journey</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Learn Nouns", desc: "Study German nouns with their articles", color: "blue" },
                { step: "2", title: "Test Memory", desc: "Quiz yourself on gender recognition", color: "green" },
                { step: "3", title: "Practice Patterns", desc: "Speak sentence patterns aloud", color: "purple" },
                { step: "4", title: "Get Feedback", desc: "Receive corrections and improve", color: "orange" }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 bg-${item.color}-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3`}>
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreachingPage;