
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import VocabularyCard from '@/components/VocabularyCard';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, PlusCircle } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';

const VocabularyPage = () => {
  const {
    vocabulary,
    getVocabularyByLanguage,
    canCreateMore,
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
  const [showForm, setShowForm] = useState(false);
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
        
        {!isMobile && canCreateMore && (
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Word
          </Button>
        )}
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
      
      {/* Mobile Add Button */}
      {isMobile && canCreateMore && (
        <Button 
          onClick={() => setShowForm(true)} 
          className="w-full mb-4"
          size="sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Word
        </Button>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Vocabulary Form for mobile */}
        {isMobile && showForm && (
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <VocabularyPlaylist 
                vocabulary={languageVocabulary} 
                showForm={showForm} 
                onCloseForm={() => setShowForm(false)} 
                compact={true}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Vocabulary List */}
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowForm(true)} 
                  className="mt-4" 
                  disabled={!canCreateMore}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Word
                </Button>
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
        
        {/* Vocabulary Form for desktop */}
        {!isMobile && (
          <Card className="h-full">
            <CardContent className="pt-6">
              <VocabularyPlaylist 
                vocabulary={languageVocabulary} 
                showForm={showForm} 
                onCloseForm={() => setShowForm(false)} 
              />
            </CardContent>
          </Card>
        )}
        
        {/* Subscription Upgrade Card */}
        {!subscription.isSubscribed && (
          <div className="mt-2 sm:mt-4">
            <UpgradePrompt 
              title="Unlimited Vocabulary" 
              message="Premium subscribers can create unlimited vocabulary lists to enhance their learning." 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
