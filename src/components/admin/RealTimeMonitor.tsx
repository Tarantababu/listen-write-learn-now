
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, Eye, MousePointerClick } from 'lucide-react';

interface RealtimeEvent {
  id: string;
  type: 'visitor' | 'user' | 'subscription' | 'click';
  timestamp: string;
  data: any;
}

export function RealTimeMonitor() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up real-time subscriptions for visitor tracking
    const visitorsChannel = supabase
      .channel('realtime-visitors')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitors'
        },
        (payload) => {
          // Safe property access with type checking
          const newData = payload.new as any;
          if (newData && typeof newData === 'object') {
            const newEvent: RealtimeEvent = {
              id: newData.id || 'unknown',
              type: 'visitor',
              timestamp: new Date().toISOString(),
              data: {
                page: newData.page || 'unknown',
                visitor_id: newData.visitor_id ? newData.visitor_id.substring(0, 8) + '...' : 'unknown',
                referer: newData.referer || null
              }
            };
            
            setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Set up real-time subscriptions for new users
    const profilesChannel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Safe property access with type checking
          const newData = payload.new as any;
          if (newData && typeof newData === 'object') {
            const newEvent: RealtimeEvent = {
              id: newData.id || 'unknown',
              type: 'user',
              timestamp: new Date().toISOString(),
              data: {
                user_id: newData.id ? newData.id.substring(0, 8) + '...' : 'unknown',
                language: newData.selected_language || 'unknown'
              }
            };
            
            setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    // Set up real-time subscriptions for subscriber changes
    const subscribersChannel = supabase
      .channel('realtime-subscribers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers'
        },
        (payload) => {
          // Safe property access with type checking
          const newData = payload.new as any;
          const oldData = payload.old as any;
          const eventData = newData || oldData;
          
          if (eventData && typeof eventData === 'object') {
            const newEvent: RealtimeEvent = {
              id: eventData.id || 'unknown',
              type: 'subscription',
              timestamp: new Date().toISOString(),
              data: {
                email: eventData.email || 'unknown',
                subscribed: eventData.subscribed || false,
                tier: eventData.subscription_tier || 'unknown',
                event: payload.eventType || 'unknown'
              }
            };
            
            setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitorsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscribersChannel);
    };
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'visitor': return <Eye className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'subscription': return <Activity className="h-4 w-4" />;
      case 'click': return <MousePointerClick className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'visitor': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'subscription': return 'bg-purple-100 text-purple-800';
      case 'click': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDescription = (event: RealtimeEvent) => {
    switch (event.type) {
      case 'visitor':
        return `Visitor ${event.data.visitor_id} visited ${event.data.page}`;
      case 'user':
        return `New user registered (${event.data.user_id})`;
      case 'subscription':
        return `Subscription ${event.data.event}: ${event.data.email} - ${event.data.tier}`;
      case 'click':
        return `Button clicked: ${event.data.page}`;
      default:
        return 'Unknown event';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Real-Time Activity Monitor</span>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Waiting for real-time events...
            </p>
          ) : (
            events.map((event) => (
              <div
                key={`${event.id}-${event.timestamp}`}
                className="flex items-center gap-3 p-2 border rounded-lg"
              >
                <div className={`p-1 rounded ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formatEventDescription(event)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
