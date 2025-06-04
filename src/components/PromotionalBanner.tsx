
import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface PromotionalBanner {
  id: string;
  title: string;
  content: string;
  button_text?: string;
  button_url?: string;
  background_color?: string;
  text_color?: string;
  banner_type?: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  promo_code?: string;
}

export function PromotionalBanner() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const location = useLocation();

  useEffect(() => {
    fetchActiveBanners();
  }, [location.pathname]);

  const fetchActiveBanners = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_banners_for_route', {
        route_param: location.pathname
      });

      if (error) {
        console.error('Error fetching banners:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const dismissBanner = (bannerId: string) => {
    setDismissedBanners(prev => new Set(prev).add(bannerId));
  };

  const getVariantFromType = (type?: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const visibleBanners = banners.filter(banner => !dismissedBanners.has(banner.id));

  if (visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleBanners.map((banner) => (
        <Alert
          key={banner.id}
          variant={getVariantFromType(banner.banner_type)}
          className="relative"
          style={{
            backgroundColor: banner.background_color || undefined,
            color: banner.text_color || undefined,
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 pr-8">
              <div className="font-medium">{banner.title}</div>
              <AlertDescription className="mt-1">
                {banner.content}
                {banner.promo_code && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded text-sm font-mono">
                    {banner.promo_code}
                  </span>
                )}
              </AlertDescription>
              {banner.button_text && banner.button_url && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-white/10 border-white/20 hover:bg-white/20"
                  >
                    <a href={banner.button_url} target="_blank" rel="noopener noreferrer">
                      {banner.button_text}
                    </a>
                  </Button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissBanner(banner.id)}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
