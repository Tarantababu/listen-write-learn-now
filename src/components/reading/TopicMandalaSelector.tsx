
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  Plane, 
  Utensils, 
  Smartphone, 
  Leaf, 
  Heart, 
  GraduationCap, 
  Briefcase,
  Gamepad2,
  Users
} from 'lucide-react';

const TOPIC_MANDALA_OPTIONS = [
  { 
    id: 'daily-routines', 
    label: 'Daily Life', 
    icon: Coffee, 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Morning habits, routines, everyday activities'
  },
  { 
    id: 'travel-culture', 
    label: 'Travel', 
    icon: Plane, 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Adventures, cultures, places to visit'
  },
  { 
    id: 'food-cooking', 
    label: 'Food', 
    icon: Utensils, 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: 'Recipes, restaurants, culinary experiences'
  },
  { 
    id: 'technology', 
    label: 'Technology', 
    icon: Smartphone, 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Digital life, gadgets, innovation'
  },
  { 
    id: 'environment', 
    label: 'Nature', 
    icon: Leaf, 
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Environment, sustainability, wildlife'
  },
  { 
    id: 'health-fitness', 
    label: 'Wellness', 
    icon: Heart, 
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Health, fitness, mental wellbeing'
  },
  { 
    id: 'education', 
    label: 'Learning', 
    icon: GraduationCap, 
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Education, skills, personal growth'
  },
  { 
    id: 'business', 
    label: 'Work', 
    icon: Briefcase, 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Career, entrepreneurship, professional life'
  }
];

interface TopicMandalaSelectorProps {
  selectedTopic: string;
  onTopicSelect: (topicId: string) => void;
}

export const TopicMandalaSelector: React.FC<TopicMandalaSelectorProps> = ({
  selectedTopic,
  onTopicSelect
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Topic</h3>
        <p className="text-sm text-muted-foreground">
          Select what you'd like to read about
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TOPIC_MANDALA_OPTIONS.map((topic) => {
          const IconComponent = topic.icon;
          const isSelected = selectedTopic === topic.id;
          
          return (
            <Card
              key={topic.id}
              className={`
                p-4 cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
                }
              `}
              onClick={() => onTopicSelect(topic.id)}
            >
              <div className="text-center space-y-2">
                <div className={`
                  w-12 h-12 mx-auto rounded-full flex items-center justify-center
                  ${isSelected ? 'bg-primary text-primary-foreground' : topic.color}
                `}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{topic.label}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {topic.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
