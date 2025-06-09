
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight } from 'lucide-react';

const BidirectionalMethodLink: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === '/dashboard/exercises/bidirectional';

  return (
    <Link to="/dashboard/exercises/bidirectional" className="block">
      <Card className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-primary bg-primary/5' : ''
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5" />
            Bidirectional Method
          </CardTitle>
          <CardDescription>
            Practice translation in both directions with spaced repetition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create exercises where you translate sentences back and forth between languages, 
            building deeper understanding through reflection and repetition.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BidirectionalMethodLink;
