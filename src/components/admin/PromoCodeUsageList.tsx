
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoCodeUsage {
  id: string;
  email: string;
  promo_code: string;
  stripe_session_id?: string;
  discount_amount?: number;
  created_at: string;
}

export function PromoCodeUsageList() {
  const [usages, setUsages] = useState<PromoCodeUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsages();
  }, []);

  const fetchUsages = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_code_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsages(data || []);
    } catch (error) {
      console.error('Error fetching promo code usage:', error);
      toast.error('Failed to fetch promo code usage');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading promo code usage...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo Code Usage History</CardTitle>
      </CardHeader>
      <CardContent>
        {usages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No promo code usage found.
          </p>
        ) : (
          <div className="space-y-3">
            {usages.map((usage) => (
              <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{usage.email}</span>
                    <Badge variant="secondary">{usage.promo_code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(usage.created_at).toLocaleString()}
                  </p>
                  {usage.stripe_session_id && (
                    <p className="text-xs text-muted-foreground">
                      Session: {usage.stripe_session_id}
                    </p>
                  )}
                </div>
                {usage.discount_amount && (
                  <Badge variant="outline">
                    -${(usage.discount_amount / 100).toFixed(2)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
