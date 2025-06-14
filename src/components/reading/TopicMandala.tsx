
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopicSuggestion {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: string;
}

interface TopicMandalaProps {
  onTopicSelect: (topic: string) => void;
  selectedTopic: string;
}

const MANDALA_TOPICS: TopicSuggestion[] = [
  // Center - Core topics
  { id: 'daily-life', label: 'Daily Life', description: 'Everyday activities and routines', category: 'core', icon: '🏠' },
  { id: 'travel', label: 'Travel', description: 'Adventures and cultural exploration', category: 'core', icon: '✈️' },
  { id: 'food', label: 'Food & Dining', description: 'Culinary experiences and traditions', category: 'core', icon: '🍽️' },
  
  // Inner ring - Personal
  { id: 'relationships', label: 'Relationships', description: 'Family, friends, and social connections', category: 'personal', icon: '👥' },
  { id: 'hobbies', label: 'Hobbies', description: 'Leisure activities and interests', category: 'personal', icon: '🎨' },
  { id: 'health', label: 'Health & Wellness', description: 'Physical and mental well-being', category: 'personal', icon: '💪' },
  { id: 'emotions', label: 'Emotions', description: 'Feelings and emotional experiences', category: 'personal', icon: '❤️' },
  
  // Middle ring - Social
  { id: 'work', label: 'Work & Career', description: 'Professional life and workplace', category: 'social', icon: '💼' },
  { id: 'education', label: 'Education', description: 'Learning and academic experiences', category: 'social', icon: '📚' },
  { id: 'community', label: 'Community', description: 'Local events and social gatherings', category: 'social', icon: '🏘️' },
  { id: 'shopping', label: 'Shopping', description: 'Retail experiences and consumer culture', category: 'social', icon: '🛍️' },
  
  // Outer ring - World
  { id: 'technology', label: 'Technology', description: 'Digital innovations and modern life', category: 'world', icon: '💻' },
  { id: 'environment', label: 'Environment', description: 'Nature and sustainability', category: 'world', icon: '🌱' },
  { id: 'culture', label: 'Arts & Culture', description: 'Creative expressions and traditions', category: 'world', icon: '🎭' },
  { id: 'current-events', label: 'Current Events', description: 'News and contemporary issues', category: 'world', icon: '📰' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'core': return 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800';
    case 'personal': return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800';
    case 'social': return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800';
    case 'world': return 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800';
    default: return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800';
  }
};

export const TopicMandala: React.FC<TopicMandalaProps> = ({ onTopicSelect, selectedTopic }) => {
  const categories = ['core', 'personal', 'social', 'world'];
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Topic</h3>
        <p className="text-sm text-muted-foreground">
          Select from our curated topics organized by relevance to your daily life
        </p>
      </div>
      
      {categories.map((category) => {
        const categoryTopics = MANDALA_TOPICS.filter(topic => topic.category === category);
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getCategoryColor(category)}>
                {categoryTitle}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {category === 'core' && 'Essential everyday topics'}
                {category === 'personal' && 'Personal interests and experiences'}
                {category === 'social' && 'Community and professional life'}
                {category === 'world' && 'Broader world and contemporary topics'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryTopics.map((topic) => (
                <Card 
                  key={topic.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTopic === topic.label 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onTopicSelect(topic.label)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{topic.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight">{topic.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
