
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Lightbulb } from 'lucide-react';

export const OnboardingSettings: React.FC = () => {
  const { restartOnboarding, isLoading } = useOnboarding();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Platform Tour</CardTitle>
        </div>
        <CardDescription>
          Take a guided tour of the platform to learn about its features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => restartOnboarding()}
          disabled={isLoading}
          variant="secondary"
        >
          Restart Platform Tour
        </Button>
      </CardContent>
    </Card>
  );
};
