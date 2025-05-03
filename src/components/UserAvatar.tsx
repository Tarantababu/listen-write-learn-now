
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className = '', size = 'md' }) => {
  const { avatarUrl } = useUserSettingsContext();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reset error state if avatarUrl changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(!!avatarUrl);
  }, [avatarUrl]);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };
  
  const getInitials = () => {
    if (!user) return '?';
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || '?';
  };
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className} ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300`}>
      {avatarUrl && !imageError && (
        <AvatarImage 
          src={avatarUrl} 
          alt="User" 
          onError={() => setImageError(true)}
          onLoad={() => setIsLoading(false)}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
