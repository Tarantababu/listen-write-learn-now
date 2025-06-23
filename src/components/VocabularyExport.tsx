
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileText, Loader2, Download, Info, Sparkles } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Quick Export Button */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Quick Export</h3>
              <p className="text-xs text-muted-foreground">Export {vocabulary.length} words as {selectedFormatInfo?.name}</p>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {vocabulary.length} items
            </Badge>
          </div>
          
          <Button 
            onClick={handleExport} 
            className="w-full h-10 bg-primary hover:bg-primary/90 shadow-sm"
            disabled={!canExport || isExporting}
            size="sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Export Format</Label>
        </div>
        
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_FORMATS.map(format => (
              <SelectItem key={format.id} value={format.id} className="py-3">
                <div className="flex flex-col gap-1 w-full">
                  <div className="font-medium text-sm">{format.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Compatible Tools */}
        {selectedFormatInfo && (
          <div className="bg-muted/30 rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Compatible with:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFormatInfo.supportedTools.map(tool => (
                <Badge key={tool} variant="secondary" className="text-xs h-5 px-2">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audio Option */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
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

      {/* Export Summary */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="font-medium text-sm text-primary">Export Summary</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>{vocabulary.length} words</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>{selectedFormatInfo?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Audio: {includeAudio ? 'Included' : 'Excluded'}</span>
              </div>
              {vocabulary.filter(v => v.audioUrl).length > 0 && includeAudio && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>{vocabulary.filter(v => v.audioUrl).length} with audio</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Limits */}
      {!subscription.isSubscribed && (
        <Alert variant="default" className="border-amber-200 bg-amber-50/50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
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

      {/* Download Notice */}
      <p className="text-xs text-muted-foreground text-center">
        Download will start automatically when export is complete
      </p>
    </div>
  );
};

export default VocabularyExport;
