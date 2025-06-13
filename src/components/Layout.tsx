
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import SessionWarning from './SessionWarning';
import { ServiceStatusBanner } from './ServiceStatusBanner';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <ServiceStatusBanner />
      <Header />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      
      {/* Session warning with longer timeout for better UX */}
      <SessionWarning 
        timeout={45 * 60 * 1000} // 45 minutes instead of default 30
        warningTime={3 * 60 * 1000} // 3 minutes warning
      />
    </div>
  );
};

export default Layout;
