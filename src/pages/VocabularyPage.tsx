
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Language } from '@/types';
import VocabularyCard from '@/components/VocabularyCard';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import { Download } from 'lucide-react';
import { exportToAnki } from '@/utils/ankiExport';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function VocabularyPage() {
  const { vocabulary, loading } = useVocabularyContext();
  const { settings } = useUserSettingsContext();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const isPremium = subscription.isSubscribed && subscription.subscriptionTier === 'premium';
  const FREE_USER_VOCABULARY_LIMIT = 5;

  // Filter vocabulary by the currently selected language
  const languageVocabulary = vocabulary.filter(
    item => item.language === settings.selectedLanguage
  );

  const handleExportToAnki = async () => {
    try {
      await exportToAnki(languageVocabulary, settings.selectedLanguage);
    } catch (error) {
      console.error('Error exporting to Anki:', error);
    }
  };
  
  const handleUpgrade = () => {
    navigate('/dashboard/subscription');
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Vocabulary
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            {isPremium ? (
              <span>{vocabulary.length} items in your vocabulary</span>
            ) : (
              <span>{vocabulary.length}/{FREE_USER_VOCABULARY_LIMIT} items in your vocabulary</span>
            )}
            {!isPremium && vocabulary.length >= FREE_USER_VOCABULARY_LIMIT && (
              <button 
                className="text-blue-500 hover:underline" 
                onClick={handleUpgrade}
              >
                Upgrade to premium
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportToAnki}
            disabled={languageVocabulary.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> 
            Export to Anki
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Vocabulary</TabsTrigger>
          {/* Removing the text tab as VocabularyHighlighter requires an exercise */}
          <TabsTrigger value="audio">Audio Playlist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {loading ? (
            <div className="text-center py-8">Loading vocabulary...</div>
          ) : languageVocabulary.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">You don't have any vocabulary items yet.</p>
                <Button onClick={() => navigate('/dashboard/exercises')}>Add Your First Words</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {languageVocabulary.map(item => (
                <VocabularyCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="audio">
          <Card>
            <CardContent className="pt-6">
              <VocabularyPlaylist vocabularyItems={languageVocabulary} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
