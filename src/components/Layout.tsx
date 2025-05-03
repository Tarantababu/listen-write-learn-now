
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import AppNavBar from './AppNavBar';
import { useAuth } from '@/contexts/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-accent-beige/30">
      <Header />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      {user && <AppNavBar />}
    </div>
  );
};

export default Layout;
