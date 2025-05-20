
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { OnboardingStep } from '@/contexts/OnboardingContext';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Settings } from 'lucide-react';

export const OnboardingStepsAdmin: React.FC = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<OnboardingStep>>({
    title: '',
    description: '',
    target_element: '',
    position: 'bottom',
    order_index: 0,
    is_active: true,
    feature_area: 'general'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Fetch onboarding steps
  const fetchSteps = async () => {
    setLoading(true);
    try {
      // Use a direct SQL query instead of the ORM to fetch onboarding steps
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Cast the data to the OnboardingStep type
      setSteps(data as OnboardingStep[]);
    } catch (error) {
      console.error('Error fetching onboarding steps:', error);
      toast.error('Failed to load onboarding steps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState((prev) => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setFormState({
      title: '',
      description: '',
      target_element: '',
      position: 'bottom',
      order_index: steps.length,
      is_active: true,
      feature_area: 'general'
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && currentId) {
        // Use a direct SQL query instead of the ORM to update the step
        const { error } = await supabase
          .from('onboarding_steps')
          .update(formState)
          .eq('id', currentId);
          
        if (error) throw error;
        toast.success('Onboarding step updated successfully');
      } else {
        // Use a direct SQL query instead of the ORM to insert the step
        const { error } = await supabase
          .from('onboarding_steps')
          .insert([formState]);
          
        if (error) throw error;
        toast.success('Onboarding step created successfully');
      }
      
      fetchSteps();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving onboarding step:', error);
      toast.error('Failed to save onboarding step');
    }
  };

  const handleEdit = (step: OnboardingStep) => {
    setFormState(step);
    setIsEditing(true);
    setCurrentId(step.id);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (id: string, currently_active: boolean) => {
    try {
      // Use a direct SQL query instead of the ORM to toggle active status
      const { error } = await supabase
        .from('onboarding_steps')
        .update({ is_active: !currently_active })
        .eq('id', id);
        
      if (error) throw error;
      fetchSteps();
      toast.success(`Step ${currently_active ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling step status:', error);
      toast.error('Failed to update step status');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Onboarding Management</CardTitle>
          </div>
          <Button variant="outline" onClick={() => { resetForm(); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Step
          </Button>
        </div>
        <CardDescription>
          Configure the onboarding experience for new users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Target Element</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.order_index}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{step.title}</TableCell>
                    <TableCell className="font-mono text-xs">{step.target_element}</TableCell>
                    <TableCell>{step.position}</TableCell>
                    <TableCell>{step.feature_area}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={step.is_active}
                        onCheckedChange={() => handleToggleActive(step.id, step.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(step)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {steps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No onboarding steps found. Add your first step to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Onboarding Step' : 'Add Onboarding Step'}</DialogTitle>
              <DialogDescription>
                Configure the details for this onboarding step
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formState.title || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formState.description || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_element">Target Element (CSS selector)</Label>
                  <Input
                    id="target_element"
                    name="target_element"
                    value={formState.target_element || ''}
                    onChange={handleInputChange}
                    placeholder="body or CSS selector"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Tooltip Position</Label>
                  <Select 
                    value={formState.position} 
                    onValueChange={(value) => handleSelectChange('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_index">Order</Label>
                  <Input
                    id="order_index"
                    name="order_index"
                    type="number"
                    value={formState.order_index || 0}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feature_area">Feature Area</Label>
                  <Input
                    id="feature_area"
                    name="feature_area"
                    value={formState.feature_area || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., dashboard, navigation"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_active"
                  checked={formState.is_active} 
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update Step' : 'Create Step'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
