
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { downloadAnkiImport } from '@/utils/ankiExport';
import { VocabularyItem } from '@/types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface VocabularyExportProps {
  vocabulary: VocabularyItem[];
}

const VocabularyExport: React.FC<VocabularyExportProps> = ({ vocabulary }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { subscription } = useSubscription();
  const { settings } = useUserSettingsContext();
  
  // Define export limits based on subscription status
  const EXPORT_LIMIT_FREE = 3;
  
  // Check if user can export based on their subscription status
  const canExport = vocabulary.length > 0;
  
  // For free users, check if they're within the export limit
  const isWithinExportLimit = subscription.isSubscribed || vocabulary.length <= EXPORT_LIMIT_FREE;

  const handleExport = async () => {
    try {
      // If user is not subscribed and trying to export more than the limit
      if (!subscription.isSubscribed && vocabulary.length > EXPORT_LIMIT_FREE) {
        toast.error(`Free users can only export up to ${EXPORT_LIMIT_FREE} vocabulary items. Upgrade to premium for unlimited exports.`);
        return;
      }
      
      setIsExporting(true);
      
      // Use the existing ankiExport utility to download the file
      await downloadAnkiImport(vocabulary, `${settings.selectedLanguage}-vocabulary`);
      
      toast.success('Vocabulary exported successfully!');
    } catch (error) {
      console.error('Error exporting vocabulary:', error);
      toast.error('Failed to export vocabulary');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleExport} 
          variant="outline" 
          className="w-full"
          disabled={!canExport || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Export as Anki Flashcards
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          {vocabulary.length} items will be exported with audio (when available)
        </p>
      </div>

      {!subscription.isSubscribed && (
        <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Free users can export up to {EXPORT_LIMIT_FREE} vocabulary items.
            {!isWithinExportLimit && (
              <strong className="block mt-1">
                You have {vocabulary.length} items, which exceeds the free limit.
              </strong>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VocabularyExport;
