import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VocabularyPlaylist from '@/components/VocabularyPlaylist';
import VocabularyCard from '@/components/VocabularyCard';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Search, Filter, BookOpen, Download, Trophy, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VocabularyExport from '@/components/VocabularyExport';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  // Local state for enhanced UX
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter vocabulary by currently selected language
  const languageVocabulary = getVocabularyByLanguage(settings.selectedLanguage);

  // Enhanced filtering with search
  const filteredVocabulary = useMemo(() => {
    let filtered = languageVocabulary;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.word?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [languageVocabulary, searchTerm]);

  // Progress calculations for better UX
  const progressPercentage = Math.min((vocabulary.length / vocabularyLimit) * 100, 100);
  const isNearLimit = vocabulary.length >= vocabularyLimit * 0.8;
  const isAtLimit = vocabulary.length >= vocabularyLimit;

  // Stats for better UX
  const vocabularyStats = useMemo(() => {
    return {
      total: languageVocabulary.length,
      filtered: filteredVocabulary.length
    };
  }, [languageVocabulary, filteredVocabulary]);

  // Handle vocabulary deletion with confirmation
  const handleDeleteVocabularyItem = (id: string) => {
    if (showDeleteConfirm === id) {
      removeVocabularyItem(id);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  // Get status color for progress
  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const count = languageVocabulary.length;
    if (count === 0) return "Start building your vocabulary library! 📚";
    if (count < 10) return "Great start! Keep adding more words! 🌱";
    if (count < 50) return "You're building a solid foundation! 💪";
    if (count < 100) return "Impressive vocabulary collection! 🎯";
    return "Amazing! You're a vocabulary master! 🏆";
  };
  
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">Vocabulary</h1>
            <Badge variant="secondary" className="text-xs">
              {languageVocabulary.length} words
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {getMotivationalMessage()}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/reading')}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Words
          </Button>
        </div>
      </div>

      {/* Enhanced Subscription Status Alert */}
      {!subscription.isSubscribed && (
        <Alert className={`mb-6 border-l-4 ${isAtLimit ? 'bg-red-50 border-red-400' : isNearLimit ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
          <div className="flex items-center gap-2">
            {isAtLimit ? <AlertCircle className="h-4 w-4 text-red-500" /> : 
             isNearLimit ? <AlertCircle className="h-4 w-4 text-yellow-500" /> : 
             <Sparkles className="h-4 w-4 text-blue-500" />}
            
            <AlertDescription className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isAtLimit ? 'Vocabulary limit reached!' : 
                       isNearLimit ? 'Approaching vocabulary limit' : 
                       'Free Plan'}
                    </span>
                    <Badge variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'} className="text-xs">
                      {vocabulary.length}/{vocabularyLimit}
                    </Badge>
                  </div>
                  
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {isAtLimit ? 'Upgrade to add unlimited vocabulary words' : 
                     `${vocabularyLimit - vocabulary.length} words remaining`}
                  </p>
                </div>
                
                <Button 
                  variant={isAtLimit ? "default" : "outline"}
                  size="sm" 
                  className={isAtLimit ? "bg-red-600 hover:bg-red-700" : "border-primary text-primary hover:bg-primary/10"}
                  onClick={() => navigate('/dashboard/subscription')}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> 
                  {isAtLimit ? 'Upgrade Now' : 'Upgrade'}
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      {languageVocabulary.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search words or definitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Active Filters Display */}
            {searchTerm && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column: Vocabulary List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Your Vocabulary List
                </CardTitle>
                {filteredVocabulary.length !== languageVocabulary.length && (
                  <Badge variant="outline" className="text-xs">
                    {filteredVocabulary.length} of {languageVocabulary.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {languageVocabulary.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Start building your vocabulary by adding words through the Vocabulary Builder when reading exercises.
                  </p>
                  <Button 
                    onClick={() => navigate('/dashboard/reading')}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Reading
                  </Button>
                </div>
              ) : filteredVocabulary.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredVocabulary.map(item => (
                    <div key={item.id} className="group relative">
                      <VocabularyCard 
                        item={item} 
                        onDelete={() => handleDeleteVocabularyItem(item.id)}
                      />
                      {/* Delete confirmation overlay */}
                      {showDeleteConfirm === item.id && (
                        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center z-10">
                          <div className="text-center">
                            <p className="text-sm font-medium text-red-900 mb-2">Delete this word?</p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteVocabularyItem(item.id)}
                              >
                                Yes, Delete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Enhanced Tools and actions */}
        <div className="space-y-4">
          {/* Enhanced Tools Tabs */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Vocabulary Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="practice" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="practice" className="flex-1 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    Practice
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex-1 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="practice" className="space-y-3">
                  {languageVocabulary.length > 0 ? (
                    <>
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          Ready to practice with {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyPlaylist vocabulary={languageVocabulary} />
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to start practicing
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="export" className="space-y-3">
                  {languageVocabulary.length > 0 ? (
                    <>
                      <div className="bg-muted/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Download className="h-4 w-4" />
                          Export {languageVocabulary.length} words
                        </div>
                      </div>
                      <VocabularyExport vocabulary={languageVocabulary} />
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Add vocabulary words to enable export
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Enhanced Subscription Upgrade Card */}
          {!subscription.isSubscribed && (
            <div className="mt-4">
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