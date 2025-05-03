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

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage);

  // Handle vocabulary deletion
  const handleDeleteVocabularyItem = (id: string) => {
    removeVocabularyItem(id);
  };
  return <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved vocabulary words
          </p>
        </div>
        
      </div>

      {/* Subscription Status Alert */}
      {!subscription.isSubscribed && <Alert className="mb-6 bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Free users are limited to {vocabularyLimit} vocabulary items. 
              <strong className="ml-1">
                {vocabulary.length}/{vocabularyLimit} items used.
              </strong>
            </span>
            <Button variant="outline" size="sm" className="ml-4 border-primary text-primary" onClick={() => navigate('/dashboard/subscription')}>
              <Sparkles className="h-3 w-3 mr-1" /> Upgrade
            </Button>
          </AlertDescription>
        </Alert>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Your Vocabulary List</CardTitle>
            </CardHeader>
            <CardContent>
              {languageVocabulary.length === 0 ? <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't added any vocabulary words yet.
                  </p>
                  <Button variant="outline" onClick={() => setShowForm(true)} className="mt-4" disabled={!canCreateMore}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Word
                  </Button>
                </div> : <div className="space-y-4">
                  {languageVocabulary.map(item => <VocabularyCard key={item.id} item={item} onDelete={() => handleDeleteVocabularyItem(item.id)} />)}
                </div>}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <div className="space-y-6">
            <VocabularyPlaylist vocabulary={languageVocabulary} showForm={showForm} onCloseForm={() => setShowForm(false)} />
            
            {/* Subscription Upgrade Card */}
            {!subscription.isSubscribed && <div className="mt-6">
                <UpgradePrompt title="Unlimited Vocabulary" message="Premium subscribers can create unlimited vocabulary lists to enhance their learning." />
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default VocabularyPage;