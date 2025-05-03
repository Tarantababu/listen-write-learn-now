
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
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
