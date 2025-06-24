
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Users, TrendingUp } from 'lucide-react';
import ShareAppModal from './ShareAppModal';
import ShareProgressModal from './ShareProgressModal';

const SharingSection: React.FC = () => {
  const [showAppShare, setShowAppShare] = useState(false);
  const [showProgressShare, setShowProgressShare] = useState(false);

  return (
    <>
      <Card className="gradient-card animate-fade-in">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Share & Connect
          </CardTitle>
          <CardDescription>
            Share your learning journey and invite friends to join
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => setShowAppShare(true)}
              variant="outline"
              className="flex items-center justify-center gap-2 h-auto py-3 px-4"
            >
              <Users className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Share App</div>
                <div className="text-xs text-muted-foreground">Invite friends to lwlnow</div>
              </div>
            </Button>
            
            <Button
              onClick={() => setShowProgressShare(true)}
              variant="outline"
              className="flex items-center justify-center gap-2 h-auto py-3 px-4"
            >
              <TrendingUp className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Share Progress</div>
                <div className="text-xs text-muted-foreground">Show your achievements</div>
              </div>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Sharing your progress motivates both you and your friends to keep learning!
          </p>
        </CardContent>
      </Card>

      <ShareAppModal 
        isOpen={showAppShare} 
        onOpenChange={setShowAppShare} 
      />
      
      <ShareProgressModal 
        isOpen={showProgressShare} 
        onOpenChange={setShowProgressShare} 
      />
    </>
  );
};

export default SharingSection;
