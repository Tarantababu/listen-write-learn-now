import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface PromotionalBanner {
  id: string;
  title: string;
  content: string;
  button_text?: string;
  button_url?: string;
  target_route: string;
  background_color?: string;
  text_color?: string;
  banner_type?: string;
  priority: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  promo_code?: string;
  created_at: string;
}

interface BannerFormData {
  title: string;
  content: string;
  button_text: string;
  button_url: string;
  target_route: string;
  background_color: string;
  text_color: string;
  banner_type: string;
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  promo_code: string;
}

const initialFormData: BannerFormData = {
  title: '',
  content: '',
  button_text: '',
  button_url: '',
  target_route: '/',
  background_color: '#3b82f6',
  text_color: '#ffffff',
  banner_type: 'info',
  priority: 1,
  is_active: true,
  start_date: '',
  end_date: '',
  promo_code: '',
};

export function PromotionalBannerManagement() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [formData, setFormData] = useState<BannerFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch promotional banners',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const bannerData = {
        title: formData.title,
        content: formData.content,
        button_text: formData.button_text || null,
        button_url: formData.button_url || null,
        target_route: formData.target_route,
        background_color: formData.background_color,
        text_color: formData.text_color,
        banner_type: formData.banner_type,
        priority: formData.priority,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        promo_code: formData.promo_code || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('promotional_banners')
          .update(bannerData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Promotional banner updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('promotional_banners')
          .insert([bannerData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Promotional banner created successfully',
        });
      }

      setFormData(initialFormData);
      setEditingId(null);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save promotional banner',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setFormData({
      title: banner.title,
      content: banner.content,
      button_text: banner.button_text || '',
      button_url: banner.button_url || '',
      target_route: banner.target_route,
      background_color: banner.background_color || '#3b82f6',
      text_color: banner.text_color || '#ffffff',
      banner_type: banner.banner_type || 'info',
      priority: banner.priority,
      is_active: banner.is_active,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      promo_code: banner.promo_code || '',
    });
    setEditingId(banner.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotional banner deleted successfully',
      });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete promotional banner',
      });
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_route">Target Route</Label>
                <Select
                  value={formData.target_route}
                  onValueChange={(value) => setFormData({ ...formData, target_route: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/*">All Pages</SelectItem>
                    <SelectItem value="/">Landing Page</SelectItem>
                    <SelectItem value="/dashboard">Dashboard</SelectItem>
                    <SelectItem value="/exercises">Exercises</SelectItem>
                    <SelectItem value="/vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="/subscription">Subscription</SelectItem>
                    <SelectItem value="/settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Button Text (Optional)</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_url">Button URL (Optional)</Label>
                <Input
                  id="button_url"
                  type="url"
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banner_type">Banner Type</Label>
                <Select
                  value={formData.banner_type}
                  onValueChange={(value) => setFormData({ ...formData, banner_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color</Label>
                <Input
                  id="text_color"
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date (Optional)</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo_code">Promo Code (Optional)</Label>
                <Input
                  id="promo_code"
                  value={formData.promo_code}
                  onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                  placeholder="e.g., SAVE20"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {editingId ? 'Update Banner' : 'Create Banner'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Promotional Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {banners.length === 0 ? (
              <p className="text-muted-foreground">No promotional banners found.</p>
            ) : (
              banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{
                    backgroundColor: banner.background_color + '20',
                    borderColor: banner.background_color + '40',
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{banner.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {banner.banner_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{banner.content}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Route: {banner.target_route}</p>
                      <p>Priority: {banner.priority}</p>
                      {banner.start_date && (
                        <p>Start: {format(new Date(banner.start_date), 'PPP p')}</p>
                      )}
                      {banner.end_date && (
                        <p>End: {format(new Date(banner.end_date), 'PPP p')}</p>
                      )}
                      {banner.promo_code && (
                        <p>Promo Code: {banner.promo_code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
