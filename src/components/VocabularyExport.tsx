
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileText, Loader2, Download, Info } from 'lucide-react';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { VocabularyItem } from '@/types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { exportManager } from '@/utils/exporters/ExportManager';
import { EXPORT_FORMATS } from '@/types/export';

interface VocabularyExportProps {
  vocabulary: VocabularyItem[];
}

const VocabularyExport: React.FC<VocabularyExportProps> = ({ vocabulary }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('apkg');
  const [includeAudio, setIncludeAudio] = useState(true);
  const { subscription } = useSubscription();
  const { settings } = useUserSettingsContext();
  
  // Define export limits based on subscription status
  const EXPORT_LIMIT_FREE = 3;
  
  // Check if user can export based on their subscription status
  const canExport = vocabulary.length > 0;
  
  // For free users, check if they're within the export limit
  const isWithinExportLimit = subscription.isSubscribed || vocabulary.length <= EXPORT_LIMIT_FREE;

  const selectedFormatInfo = EXPORT_FORMATS.find(f => f.id === selectedFormat);

  const handleExport = async () => {
    try {
      // If user is not subscribed and trying to export more than the limit
      if (!subscription.isSubscribed && vocabulary.length > EXPORT_LIMIT_FREE) {
        toast.error(`Free users can only export up to ${EXPORT_LIMIT_FREE} vocabulary items. Upgrade to premium for unlimited exports.`);
        return;
      }
      
      setIsExporting(true);
      
      const exportOptions = {
        format: selectedFormat,
        includeAudio: includeAudio,
        deckName: `${settings.selectedLanguage}-vocabulary`,
        tags: [settings.selectedLanguage]
      };
      
      const result = await exportManager.exportVocabulary(vocabulary, exportOptions);
      
      if (result.success) {
        exportManager.downloadExportResult(result);
        toast.success(`Vocabulary exported successfully as ${selectedFormatInfo?.name}!`);
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Error exporting vocabulary:', error);
      toast.error(`Failed to export vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Format
          </CardTitle>
          <CardDescription>
            Choose the format that works best with your flashcard app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format-select">Export Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger id="format-select">
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(format => (
                  <SelectItem key={format.id} value={format.id}>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compatible Tools Display */}
          {selectedFormatInfo && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Compatible with:</Label>
              <div className="flex flex-wrap gap-1">
                {selectedFormatInfo.supportedTools.map(tool => (
                  <Badge key={tool} variant="secondary" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Audio Option */}
          <div className="flex items-center space-x-2">
            <Switch
              id="include-audio"
              checked={includeAudio}
              onCheckedChange={setIncludeAudio}
            />
            <Label htmlFor="include-audio" className="text-sm">
              Include audio files (when available)
            </Label>
          </div>

          {/* Export Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Export Details:</p>
                <ul className="text-sm space-y-1">
                  <li>• {vocabulary.length} vocabulary items will be exported</li>
                  <li>• Format: {selectedFormatInfo?.name}</li>
                  <li>• Audio: {includeAudio ? 'Included' : 'Not included'}</li>
                  {vocabulary.filter(v => v.audioUrl).length > 0 && includeAudio && (
                    <li>• {vocabulary.filter(v => v.audioUrl).length} items have audio</li>
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="space-y-4">
        <Button 
          onClick={handleExport} 
          className="w-full"
          disabled={!canExport || isExporting}
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting {selectedFormatInfo?.name}...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Export as {selectedFormatInfo?.name}
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Download will start automatically when export is complete
        </p>
      </div>

      {/* Subscription Limits */}
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
