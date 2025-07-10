
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Volume2, Timer, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SentenceMiningSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

export const SentenceMiningSettings: React.FC<SentenceMiningSettingsProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState({
    autoPlayAudio: true,
    showTranslationHints: true,
    exerciseTimeLimit: 60, // seconds
    difficultyAdaptation: true,
    exercisesPerSession: 10,
    focusMode: false,
    vibrationFeedback: true,
    autoAdvance: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
    toast.success('Settings updated');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-gray-500" />
          Sentence Mining Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium">Audio Settings</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-audio">Auto-play Audio</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play sentence audio when exercise loads
                </p>
              </div>
              <Switch
                id="auto-audio"
                checked={settings.autoPlayAudio}
                onCheckedChange={(checked) => handleSettingChange('autoPlayAudio', checked)}
              />
            </div>
          </div>

          {/* Exercise Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <h3 className="font-medium">Exercise Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Exercises per Session</Label>
                <Select
                  value={settings.exercisesPerSession.toString()}
                  onValueChange={(value) => handleSettingChange('exercisesPerSession', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 exercises</SelectItem>
                    <SelectItem value="10">10 exercises</SelectItem>
                    <SelectItem value="15">15 exercises</SelectItem>
                    <SelectItem value="20">20 exercises</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Limit per Exercise (seconds)</Label>
                <Slider
                  value={[settings.exerciseTimeLimit]}
                  onValueChange={(value) => handleSettingChange('exerciseTimeLimit', value[0])}
                  max={120}
                  min={30}
                  step={15}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {settings.exerciseTimeLimit} seconds
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="translation-hints">Show Translation Hints</Label>
                  <p className="text-sm text-muted-foreground">
                    Show helpful translations during exercises
                  </p>
                </div>
                <Switch
                  id="translation-hints"
                  checked={settings.showTranslationHints}
                  onCheckedChange={(checked) => handleSettingChange('showTranslationHints', checked)}
                />
              </div>
            </div>
          </div>

          {/* Learning Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <h3 className="font-medium">Learning Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="difficulty-adaptation">Adaptive Difficulty</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust difficulty based on performance
                  </p>
                </div>
                <Switch
                  id="difficulty-adaptation"
                  checked={settings.difficultyAdaptation}
                  onCheckedChange={(checked) => handleSettingChange('difficultyAdaptation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="focus-mode">Focus Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide distracting elements during exercises
                  </p>
                </div>
                <Switch
                  id="focus-mode"
                  checked={settings.focusMode}
                  onCheckedChange={(checked) => handleSettingChange('focusMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-advance">Auto-advance</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically move to next exercise after correct answer
                  </p>
                </div>
                <Switch
                  id="auto-advance"
                  checked={settings.autoAdvance}
                  onCheckedChange={(checked) => handleSettingChange('autoAdvance', checked)}
                />
              </div>
            </div>
          </div>

          {/* Feedback Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-purple-500" />
              <h3 className="font-medium">Feedback Settings</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="vibration-feedback">Vibration Feedback</Label>
                <p className="text-sm text-muted-foreground">
                  Vibrate on mobile devices for feedback
                </p>
              </div>
              <Switch
                id="vibration-feedback"
                checked={settings.vibrationFeedback}
                onCheckedChange={(checked) => handleSettingChange('vibrationFeedback', checked)}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
