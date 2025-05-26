import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { FlagIcon, FlagIconCode } from 'react-flag-kit';
import { Logo } from '@/components/landing/Logo';

const AVAILABLE_LANGUAGES = [
  { name: 'English', code: 'GB' as FlagIconCode },
  { name: 'Spanish', code: 'ES' as FlagIconCode },
  { name: 'French', code: 'FR' as FlagIconCode },
  { name: 'German', code: 'DE' as FlagIconCode },
  { name: 'Italian', code: 'IT' as FlagIconCode },
  { name: 'Portuguese', code: 'PT' as FlagIconCode },
  { name: 'Dutch', code: 'NL' as FlagIconCode },
  { name: 'Turkish', code: 'TR' as FlagIconCode },
  { name: 'Swedish', code: 'SE' as FlagIconCode },
  { name: 'Norwegian', code: 'NO' as FlagIconCode }
];

const LanguageSelectionPage: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLanguageSelect = (languageName: string) => {
    setSelectedLanguage(languageName);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      navigate(`/signup?lang=${selectedLanguage.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gradient-to-br from-background via-background to-accent/10">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          {/* Back Button */}
          <div className="flex justify-start mb-6">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors duration-200">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            </Link>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What would you like to learn?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Choose your target language to get started with personalized exercises
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {AVAILABLE_LANGUAGES.map((language) => (
            <Card
              key={language.name}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                selectedLanguage === language.name
                  ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                  : 'hover:bg-accent/5'
              }`}
              onClick={() => handleLanguageSelect(language.name)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="w-12 h-8 overflow-hidden rounded-md shadow-sm ring-1 ring-gray-200/50 flex items-center justify-center">
                    <FlagIcon code={language.code} size={48} />
                  </div>
                </div>
                <h3 className="font-medium text-foreground text-sm sm:text-base">
                  {language.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedLanguage}
            size="lg"
            className="px-8 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 font-medium disabled:opacity-50"
          >
            {selectedLanguage ? `Continue with ${selectedLanguage}` : 'Select a language to continue'}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionPage;
