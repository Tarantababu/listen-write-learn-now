
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-64 border-r">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-x-hidden">
        <main className="container py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
