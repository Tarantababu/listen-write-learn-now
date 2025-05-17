
import React from 'react';
import DictationPractice from '@/components/DictationPractice';

const DictationPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dictation Practice</h1>
      <DictationPractice />
    </div>
  );
};

export default DictationPage;
