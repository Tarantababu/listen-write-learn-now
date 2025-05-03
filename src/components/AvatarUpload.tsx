
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import UserAvatar from './UserAvatar';
import { Loader2, Upload } from 'lucide-react';

const AvatarUpload: React.FC = () => {
  const { uploadAvatar, avatarUrl } = useUserSettingsContext();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false); // Fixed: Changed setIsLoading to setIsUploading
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative animate-fade-in">
        <UserAvatar size="lg" className="group-hover:opacity-80 transition-opacity" />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Button 
        onClick={handleButtonClick} 
        disabled={isUploading}
        variant="outline"
        className="animate-fade-in"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Change Avatar
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        JPG, PNG or GIF. Max 2MB.
      </p>
    </div>
  );
};

export default AvatarUpload;
