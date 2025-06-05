import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Percent, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
  is_active: boolean;
  created_at: string;
}

interface PromoCodeFormData {
  code: string;
  discount_percentage: number;
  valid_until: string;
  max_uses: string;
  is_active: boolean;
}

const PromoCodeManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    discount_percentage: 10,
    valid_until: '',
    max_uses: '',
    is_active: true
  });

  // Fetch promo codes
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PromoCode[];
    }
  });

  // Create promo code mutation
  const createPromoMutation = useMutation({
    mutationFn: async (data: PromoCodeFormData) => {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: data.code.toUpperCase(),
          discount_percentage: data.discount_percentage,
          valid_until: data.valid_until || null,
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          is_active: data.is_active
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promo code created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create promo code');
    }
  });

  // Update promo code mutation
  const updatePromoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromoCodeFormData }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          code: data.code.toUpperCase(),
          discount_percentage: data.discount_percentage,
          valid_until: data.valid_until || null,
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          is_active: data.is_active
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promo code updated successfully');
      setEditingPromo(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update promo code');
    }
  });

  // Delete promo code mutation
  const deletePromoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promo code deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete promo code');
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      valid_until: '',
      max_uses: '',
      is_active: true
    });
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_percentage: promo.discount_percentage,
      valid_until: promo.valid_until ? format(new Date(promo.valid_until), 'yyyy-MM-dd\'T\'HH:mm') : '',
      max_uses: promo.max_uses?.toString() || '',
      is_active: promo.is_active
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    if (formData.discount_percentage <= 0 || formData.discount_percentage > 100) {
      toast.error('Discount percentage must be between 1 and 100');
      return;
    }

    if (editingPromo) {
      updatePromoMutation.mutate({ id: editingPromo.id, data: formData });
    } else {
      createPromoMutation.mutate(formData);
    }
  };

  const getStatusBadge = (promo: PromoCode) => {
    if (!promo.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (promo.max_uses && promo.uses >= promo.max_uses) {
      return <Badge variant="destructive">Used Up</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Promo Code Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Promo Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WELCOME10"
                  className="uppercase"
                />
              </div>
              
              <div>
                <Label htmlFor="discount">Discount Percentage</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPromoMutation.isPending}>
                  Create Promo Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingPromo !== null} onOpenChange={() => setEditingPromo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Promo Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="uppercase"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-discount">Discount Percentage</Label>
              <Input
                id="edit-discount"
                type="number"
                min="1"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-validUntil">Valid Until (Optional)</Label>
              <Input
                id="edit-validUntil"
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-maxUses">Max Uses (Optional)</Label>
              <Input
                id="edit-maxUses"
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingPromo(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePromoMutation.isPending}>
                Update Promo Code
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Promo Codes List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div>Loading promo codes...</div>
        ) : promoCodes?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No promo codes created yet.</p>
            </CardContent>
          </Card>
        ) : (
          promoCodes?.map((promo) => (
            <Card key={promo.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-lg">{promo.code}</span>
                      {getStatusBadge(promo)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {promo.discount_percentage}% off
                      </span>
                      {promo.valid_until && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {format(new Date(promo.valid_until), 'MMM d, yyyy')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {promo.uses}{promo.max_uses ? `/${promo.max_uses}` : ''} uses
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deletePromoMutation.mutate(promo.id)}
                      disabled={deletePromoMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PromoCodeManagement;
