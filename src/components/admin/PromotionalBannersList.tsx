
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromotionalBanner {
  id: string;
  title: string;
  content: string;
  promo_code?: string;
  target_route: string;
  start_date?: string;
  end_date?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface PromotionalBannersListProps {
  refreshTrigger?: number;
}

export function PromotionalBannersList({ refreshTrigger }: PromotionalBannersListProps) {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, [refreshTrigger]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch promotional banners');
    } finally {
      setLoading(false);
    }
  };

  const toggleBannerStatus = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_banners')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, is_active } : banner
      ));
      
      toast.success(`Banner ${is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner status');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.filter(banner => banner.id !== id));
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  if (loading) {
    return <div>Loading promotional banners...</div>;
  }

  return (
    <div className="space-y-4">
      {banners.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No promotional banners found. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        banners.map((banner) => (
          <Card key={banner.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={banner.is_active ? "default" : "secondary"}>
                      {banner.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Priority: {banner.priority}</Badge>
                    {banner.promo_code && (
                      <Badge variant="secondary">
                        Code: {banner.promo_code}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) => toggleBannerStatus(banner.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBanner(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {banner.content}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Target: {banner.target_route}</p>
                {banner.start_date && (
                  <p>Start: {new Date(banner.start_date).toLocaleString()}</p>
                )}
                {banner.end_date && (
                  <p>End: {new Date(banner.end_date).toLocaleString()}</p>
                )}
                <p>Created: {new Date(banner.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
