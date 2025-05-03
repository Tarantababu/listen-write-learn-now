
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useUserSettingsContext();

  // Debug log to track avatar URL changes
  useEffect(() => {
    if (user) {
      console.log('Layout detected user:', user.id);
      console.log('Current avatar URL:', avatarUrl);
    }
  }, [user, avatarUrl]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
