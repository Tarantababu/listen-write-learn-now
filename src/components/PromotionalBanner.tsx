
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromotionalBanner {
  id: string;
  title: string;
  content: string;
  promo_code?: string;
  target_route: string;
  priority: number;
}

export function PromotionalBanner() {
  const [banner, setBanner] = useState<PromotionalBanner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  const fetchActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setBanner(data);
      }
    } catch (error) {
      console.error('Error fetching promotional banner:', error);
    }
  };

  if (!banner || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 p-4 border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="pr-8">
        <h3 className="font-semibold text-lg mb-2">{banner.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {banner.content}
        </p>
        {banner.promo_code && (
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground">Promo Code: </span>
            <code className="bg-background px-2 py-1 rounded text-sm font-mono border">
              {banner.promo_code}
            </code>
          </div>
        )}
        <Button asChild size="sm">
          <Link to={banner.target_route}>
            Get Started
          </Link>
        </Button>
      </div>
    </Card>
  );
}
