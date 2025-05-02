
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => navigate('/dashboard')}
      >
        <Headphones className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">ListenWriteLearn</h1>
      </div>
      
      <nav>
        <ul className="flex gap-6">
          <li>
            <button 
              onClick={() => navigate('/dashboard/exercises')}
              className="text-sm hover:text-primary transition-colors"
            >
              Exercises
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/dashboard/vocabulary')}
              className="text-sm hover:text-primary transition-colors"
            >
              Vocabulary
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="text-sm hover:text-primary transition-colors"
            >
              Settings
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
