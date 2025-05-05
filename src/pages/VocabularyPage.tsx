
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import VocabularyCard from '@/components/VocabularyCard';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VocabularyExport from '@/components/VocabularyExport';
import LanguageLevelProgress from '@/components/LanguageLevelProgress';

const VocabularyPage = () => {
  const {
    vocabulary,
    getVocabularyByLanguage,
    vocabularyLimit,
    removeVocabularyItem
  } = useVocabularyContext();
  const {
    settings
  } = useUserSettingsContext();
  const {
    subscription
  } = useSubscription();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage);

  // Handle vocabulary deletion
  const handleDeleteVocabularyItem = (id: string) => {
    removeVocabularyItem(id);
  };
  
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col gap-2 md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Vocabulary</h1>
          <p className="text-muted-foreground text-sm sm:mt-1">
            Manage your saved vocabulary words
          </p>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {!subscription.isSubscribed && (
        <Alert className="mb-4 sm:mb-6 bg-primary/5 border-primary/20 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span>
              Free users are limited to {vocabularyLimit} vocabulary items. 
              <strong className="ml-1">
                {vocabulary.length}/{vocabularyLimit} items used.
              </strong>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-0 mt-2 sm:mt-0 sm:ml-4 border-primary text-primary"
              onClick={() => navigate('/dashboard/subscription')}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Upgrade
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column: Vocabulary List */}
        <div className="md:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl">Your Vocabulary List</CardTitle>
            </CardHeader>
            <CardContent>
              {languageVocabulary.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-muted-foreground text-sm">
                    You haven't added any vocabulary words yet.
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Add words through the Vocabulary Builder when reading exercises.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {languageVocabulary.map(item => (
                    <VocabularyCard 
                      key={item.id} 
                      item={item} 
                      onDelete={() => handleDeleteVocabularyItem(item.id)} 
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Tools and actions */}
        <div className="space-y-4">
          {/* Language Level Progress */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl">Language Proficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageLevelProgress masteredWords={languageVocabulary.length} />
            </CardContent>
          </Card>
          
          {/* Tools Tabs */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl">Vocabulary Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="practice" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="practice" className="flex-1">Practice</TabsTrigger>
                  <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
                </TabsList>
                <TabsContent value="practice">
                  <VocabularyPlaylist vocabulary={languageVocabulary} />
                </TabsContent>
                <TabsContent value="export">
                  <VocabularyExport vocabulary={languageVocabulary} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Subscription Upgrade Card */}
          {!subscription.isSubscribed && (
            <div className="mt-2 sm:mt-4">
              <UpgradePrompt 
                title="Unlimited Vocabulary" 
                message="Premium subscribers can create unlimited vocabulary lists and export all their flashcards with audio." 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyPage;
