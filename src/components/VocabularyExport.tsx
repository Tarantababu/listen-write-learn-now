
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
      <Card className="border-0 shadow-sm bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            Export Format
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Choose the format that works best with your flashcard app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="format-select" className="text-sm font-medium">Export Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger id="format-select" className="h-12 text-left">
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(format => (
                  <SelectItem key={format.id} value={format.id} className="py-3">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="font-medium text-sm md:text-base">{format.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
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
            <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Compatible with:
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedFormatInfo.supportedTools.map(tool => (
                  <Badge key={tool} variant="secondary" className="text-xs px-2 py-1 font-medium">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Audio Option */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
            <div className="flex flex-col gap-1">
              <Label htmlFor="include-audio" className="text-sm font-medium cursor-pointer">
                Include audio files
              </Label>
              <span className="text-xs text-muted-foreground">
                When available for vocabulary items
              </span>
            </div>
            <Switch
              id="include-audio"
              checked={includeAudio}
              onCheckedChange={setIncludeAudio}
            />
          </div>

          {/* Export Info */}
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-sm">Export Summary:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>{vocabulary.length} vocabulary items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Format: {selectedFormatInfo?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Audio: {includeAudio ? 'Included' : 'Not included'}</span>
                  </div>
                  {vocabulary.filter(v => v.audioUrl).length > 0 && includeAudio && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>{vocabulary.filter(v => v.audioUrl).length} items have audio</span>
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="space-y-4">
        <Button 
          onClick={handleExport} 
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
          disabled={!canExport || isExporting}
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="hidden sm:inline">Exporting {selectedFormatInfo?.name}...</span>
              <span className="sm:hidden">Exporting...</span>
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Export as {selectedFormatInfo?.name}</span>
              <span className="sm:hidden">Export</span>
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center px-4">
          Download will start automatically when export is complete
        </p>
      </div>

      {/* Subscription Limits */}
      {!subscription.isSubscribed && (
        <Alert variant="default" className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="space-y-2">
              <p className="font-medium text-sm">
                Free users can export up to {EXPORT_LIMIT_FREE} vocabulary items.
              </p>
              {!isWithinExportLimit && (
                <p className="text-sm">
                  You have {vocabulary.length} items, which exceeds the free limit. 
                  <span className="font-medium block mt-1">Upgrade to premium for unlimited exports.</span>
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VocabularyExport;
