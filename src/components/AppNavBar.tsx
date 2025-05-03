
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, BookOpen, CreditCard, Settings } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';

const AppNavBar: React.FC = () => {
  const location = useLocation();
  const [navItems, setNavItems] = useState([
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Exercises', url: '/dashboard/exercises', icon: BookOpen },
    { name: 'Vocabulary', url: '/dashboard/vocabulary', icon: BookOpen },
    { name: 'Subscription', url: '/dashboard/subscription', icon: CreditCard }
  ]);

  // Set active tab based on current route
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    let currentPath = pathSegments.length > 2 ? `/dashboard/${pathSegments[2]}` : '/dashboard';
    
    setNavItems(prev => 
      prev.map(item => ({
        ...item,
        isActive: item.url === currentPath
      }))
    );
  }, [location]);

  return <NavBar items={navItems} className="z-40" />;
};

export default AppNavBar;
