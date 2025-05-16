
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Roadmap, RoadmapNode, RoadmapLanguage, Language, LanguageLevel } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const RoadmapEditor: React.FC = () => {
  // Display a message that roadmaps are no longer used
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Roadmap Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-8 text-center">
          <p className="text-lg mb-4">
            The Roadmap feature has been replaced by the Default Exercises system.
          </p>
          <p>
            Please use the Default Exercises management interface to create and organize language learning content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapEditor;
