
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSecurityMonitoring() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for security events in real-time
    const channel = supabase
      .channel('security-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const log = payload.new;
          
          // Show toast for important security events
          if (log.event_type === 'security_violation') {
            toast.error('Security Alert', {
              description: 'Suspicious activity detected on your account.',
              duration: 10000,
            });
          } else if (log.event_type === 'admin_action') {
            toast.info('Admin Action', {
              description: 'Administrative action performed.',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}

export function useAdminValidation() {
  const { user } = useAuth();

  const validateAdminAccess = async () => {
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      const { data, error } = await supabase.rpc('validate_admin_access');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Admin validation failed:', error);
      throw new Error('Admin access required');
    }
  };

  return { validateAdminAccess };
}

export function useSecurityLogging() {
  const logSecurityEvent = async (
    eventType: string,
    eventDetails?: any,
    userId?: string
  ) => {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        event_type: eventType,
        event_details: eventDetails ? JSON.stringify(eventDetails) : null,
        user_id_param: userId || null
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  };

  return { logSecurityEvent };
}
