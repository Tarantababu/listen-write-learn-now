
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Share2, Copy, MessageSquare, Smartphone } from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onOpenChange }) => {
  const [shareType, setShareType] = useState<'default' | 'custom'>('default');
  const [customMessage, setCustomMessage] = useState('');

  const defaultMessage = "I've been using lwlnow to learn languages through dictation-based exercises! It's really helping me improve my listening and writing skills. Check it out!";
  const appUrl = 'https://lwlnow.com';

  const getShareMessage = () => {
    const message = shareType === 'custom' ? customMessage : defaultMessage;
    return `${message}\n\n${appUrl}`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareMessage());
      toast.success('Share message copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'lwlnow - Language Learning App',
          text: getShareMessage(),
          url: appUrl,
        });
      } catch (error) {
        // User cancelled the share or it failed
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const message = encodeURIComponent(getShareMessage());
    const url = encodeURIComponent(appUrl);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${message}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share lwlnow
          </DialogTitle>
          <DialogDescription>
            Share this language learning app with your friends and help them improve their language skills!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Message Type</Label>
            <RadioGroup 
              value={shareType} 
              onValueChange={(value) => setShareType(value as 'default' | 'custom')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default">Use default message</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Write custom message</Label>
              </div>
            </RadioGroup>
          </div>

          {shareType === 'default' && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{defaultMessage}</p>
            </div>
          )}

          {shareType === 'custom' && (
            <div>
              <Label htmlFor="custom-message">Your message</Label>
              <Textarea
                id="custom-message"
                placeholder="Write your personal recommendation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                onClick={handleShareNative} 
                className="flex-1"
                variant="default"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={handleCopyToClipboard} 
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Or share on social media:</p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('twitter')}
                >
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('facebook')}
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSocialShare('whatsapp')}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAppModal;
