
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Save, Trash, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { OnboardingStep } from '@/types/onboarding';
import { toast } from 'sonner';

export function OnboardingStepsAdmin() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load onboarding steps
  const loadSteps = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setSteps(data as OnboardingStep[]);
      }
    } catch (error) {
      console.error('Error loading onboarding steps:', error);
      toast.error('Failed to load onboarding steps');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSteps();
  }, []);

  // Save edited step
  const saveStep = async () => {
    if (!editingStep) return;
    
    try {
      setIsLoading(true);
      
      if (editingStep.id) {
        // Update existing step
        const { error } = await supabase
          .from('onboarding_steps')
          .update({
            title: editingStep.title,
            description: editingStep.description,
            target_element: editingStep.target_element,
            position: editingStep.position,
            order_index: editingStep.order_index,
            feature_area: editingStep.feature_area,
            is_active: editingStep.is_active
          })
          .eq('id', editingStep.id);
        
        if (error) throw error;
        toast.success('Step updated successfully');
      } else {
        // Create new step
        const { error } = await supabase
          .from('onboarding_steps')
          .insert([{
            title: editingStep.title,
            description: editingStep.description,
            target_element: editingStep.target_element,
            position: editingStep.position,
            order_index: editingStep.order_index,
            feature_area: editingStep.feature_area,
            is_active: editingStep.is_active
          }]);
        
        if (error) throw error;
        toast.success('Step created successfully');
      }
      
      // Reload steps and reset state
      await loadSteps();
      setEditingStep(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error('Failed to save onboarding step');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle step active status
  const toggleStepActive = async (stepId: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('onboarding_steps')
        .update({ is_active: isActive })
        .eq('id', stepId);
      
      if (error) throw error;
      
      toast.success(`Step ${isActive ? 'activated' : 'deactivated'} successfully`);
      loadSteps();
    } catch (error) {
      console.error('Error toggling step active status:', error);
      toast.error('Failed to update step status');
    } finally {
      setIsLoading(false);
    }
  };

  // Start creating a new step
  const startCreatingStep = () => {
    const highestOrderIndex = steps.length > 0 
      ? Math.max(...steps.map(s => s.order_index)) 
      : -1;
      
    setEditingStep({
      id: '', // Empty ID for new step
      title: '',
      description: '',
      target_element: '',
      position: 'bottom',
      order_index: highestOrderIndex + 1,
      feature_area: '',
      is_active: true
    });
    setIsCreating(true);
  };

  // Start editing an existing step
  const startEditingStep = (step: OnboardingStep) => {
    setEditingStep({...step});
    setIsCreating(false);
  };

  // Cancel editing or creating
  const cancelEdit = () => {
    setEditingStep(null);
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Steps Management</CardTitle>
        <CardDescription>
          Configure the steps that guide users through the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!editingStep ? (
          <>
            <Button 
              onClick={startCreatingStep} 
              className="mb-4"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Feature Area</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>{step.order_index}</TableCell>
                    <TableCell>{step.title}</TableCell>
                    <TableCell>{step.feature_area}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={step.is_active} 
                        onCheckedChange={(checked) => toggleStepActive(step.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEditingStep(step)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {steps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No onboarding steps defined yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={editingStep.title} 
                onChange={(e) => setEditingStep({...editingStep, title: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={editingStep.description} 
                onChange={(e) => setEditingStep({...editingStep, description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="target_element">Target Element (CSS Selector)</Label>
              <Input 
                id="target_element" 
                value={editingStep.target_element} 
                onChange={(e) => setEditingStep({...editingStep, target_element: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Select 
                value={editingStep.position} 
                onValueChange={(value) => setEditingStep({...editingStep, position: value})}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="order_index">Display Order</Label>
              <Input 
                id="order_index" 
                type="number" 
                value={editingStep.order_index.toString()} 
                onChange={(e) => setEditingStep({
                  ...editingStep, 
                  order_index: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="feature_area">Feature Area</Label>
              <Input 
                id="feature_area" 
                value={editingStep.feature_area} 
                onChange={(e) => setEditingStep({...editingStep, feature_area: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active"
                checked={editingStep.is_active} 
                onCheckedChange={(checked) => setEditingStep({...editingStep, is_active: checked})}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
        )}
      </CardContent>
      {editingStep && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={cancelEdit}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={saveStep}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Create' : 'Update'} Step
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
