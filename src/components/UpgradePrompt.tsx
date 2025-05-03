
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  message?: string;
  showButton?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = "Upgrade to Premium",
  message = "Unlock unlimited exercises, vocabulary lists, and more features with our premium subscription.",
  showButton = true
}) => {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
      </CardContent>
      {showButton && (
        <CardFooter>
          <Button 
            onClick={() => navigate('/dashboard/subscription')}
            className="w-full bg-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UpgradePrompt;
